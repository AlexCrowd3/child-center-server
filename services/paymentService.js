const db = require('../database/connection');
const crypto = require('crypto');
const { generateContractPDF } = require('./contractService');
const { createSystemNotification } = require('./notificationService');

/**
 * Формат даты в RU формате
 */
function formatDate(date) {
  return date.toLocaleDateString('ru-RU');
}

/**
 * Проверка, что покупка ещё не оплачена
 */
async function ensurePurchaseNotPaid(purchaseId) {
  const existing = await db('payments')
    .where({ purchase_request_id: purchaseId, status: 'success' })
    .first();
  if (existing) throw new Error('Purchase already paid');
}

/**
 * Генерация следующего номера договора
 */
async function generateContractNumber() {
  const last = await db('payments')
    .whereNotNull('contract_number')
    .orderBy('contract_number', 'desc')
    .orderBy('id', 'desc')
    .first();

  return last ? last.contract_number + 1 : 100;
}

/**
 * Создание платежа до оплаты (онлайн)
 */
async function createPayment(userId, purchaseRequestId, amount) {
  const fakeProviderId = crypto.randomBytes(8).toString('hex');

  await db('payments').insert({
    user_id: userId,
    purchase_request_id: purchaseRequestId,
    provider: 'mock',
    provider_payment_id: fakeProviderId,
    amount,
    status: 'pending',
  });

  return {
    payment_url: `https://fakepay.com/pay/${fakeProviderId}`,
    provider_payment_id: fakeProviderId,
  };
}

/**
 * Обработка успешного онлайн-платежа
 */
async function handleSuccessfulPayment(providerPaymentId) {
  await db.transaction(async trx => {
    const payment = await trx('payments')
      .where({ provider_payment_id: providerPaymentId })
      .first();
    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'success') return;

    await ensurePurchaseNotPaid(payment.purchase_request_id);

    const contractNumber = await generateContractNumber();
    const now = new Date();
    const contractLabel = `Оплата по договору №${contractNumber} от ${formatDate(now)}`;

    await trx('payments')
      .where({ id: payment.id })
      .update({
        status: 'success',
        paid_at: trx.fn.now(),
        contract_number: contractNumber,
        contract_label: contractLabel,
      });

    const purchase = await trx('purchase_requests')
      .where({ id: payment.purchase_request_id })
      .first();

    const pricePerLesson = purchase.calculated_price / purchase.lessons_requested;

    await trx('user_subscriptions').insert({
      user_id: payment.user_id,
      subscription_type_id: purchase.subscription_type_id,
      individual_activity_id: purchase.activity_type_id || null,
      lessons_total: purchase.lessons_requested,
      lessons_left: purchase.lessons_requested,
      price_per_lesson: pricePerLesson,
      teacher_payout_per_lesson: 0,
      end_date: trx.raw("date('now','+30 days')"),
    });

    await generateContractPDF({
      contractNumber,
      contractLabel,
      userName: `${purchase.first_name} ${purchase.last_name}`,
      amount: payment.amount,
    });

    await createSystemNotification(
      payment.user_id,
      'Оплата принята',
      `Ваш платеж успешно получен.\n${contractLabel}`
    );

    await trx('purchase_requests')
      .where({ id: purchase.id })
      .update({ status: 'approved' });
  });
}

/**
 * Создание оффлайн платежа
 */
async function createOfflinePayment(userId, purchaseRequestId, amount) {
  return await db.transaction(async trx => {
    await ensurePurchaseNotPaid(purchaseRequestId);

    const contractNumber = await generateContractNumber();
    const now = new Date();
    const contractLabel = `Оплата по договору №${contractNumber} от ${formatDate(now)}`;

    const [paymentId] = await trx('payments').insert({
      user_id: userId,
      purchase_request_id: purchaseRequestId,
      provider: 'offline',
      amount,
      status: 'success',
      contract_number: contractNumber,
      contract_label: contractLabel,
      paid_at: trx.fn.now(),
    }).returning('id');

    const purchase = await trx('purchase_requests')
      .where({ id: purchaseRequestId })
      .first();

    const pricePerLesson = purchase.calculated_price / purchase.lessons_requested;

    await trx('user_subscriptions').insert({
      user_id: userId,
      subscription_type_id: purchase.subscription_type_id,
      individual_activity_id: purchase.activity_type_id || null,
      lessons_total: purchase.lessons_requested,
      lessons_left: purchase.lessons_requested,
      price_per_lesson: pricePerLesson,
      teacher_payout_per_lesson: 0,
      end_date: trx.raw("date('now','+30 days')"),
    });

    await generateContractPDF({
      contractNumber,
      contractLabel,
      userName: `${purchase.first_name} ${purchase.last_name}`,
      amount,
    });

    await createSystemNotification(
      userId,
      'Оплата принята',
      `Платёж подтверждён администратором.\n${contractLabel}`
    );

    await trx('purchase_requests')
      .where({ id: purchaseRequestId })
      .update({ status: 'approved' });

    return { payment_id: paymentId };
  });
}

module.exports = {
  createPayment,
  handleSuccessfulPayment,
  createOfflinePayment,
};