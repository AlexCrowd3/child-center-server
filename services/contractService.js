const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateContractPDF({
    contractNumber,
    contractLabel,
    userName,
    amount
}) {

    return new Promise((resolve, reject) => {

        const contractsDir = path.join(__dirname, '..', 'storage', 'contracts');

        if (!fs.existsSync(contractsDir)) {
            fs.mkdirSync(contractsDir, { recursive: true });
        }

        const fileName = `contract-${contractNumber}.pdf`;
        const filePath = path.join(contractsDir, fileName);

        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        doc.fontSize(18).text('ДОГОВОР ОКАЗАНИЯ УСЛУГ', { align: 'center' });

        doc.moveDown();

        doc.fontSize(12).text(contractLabel);

        doc.moveDown();

        doc.text(`Клиент: ${userName}`);
        doc.text(`Сумма оплаты: ${amount} RUB`);

        doc.moveDown();

        doc.text(
            'Настоящим подтверждается факт оплаты образовательных услуг.'
        );

        doc.moveDown(4);

        doc.text('____________________');
        doc.text('Подпись исполнителя');

        doc.end();

        stream.on('finish', () => {
            resolve(`/storage/contracts/${fileName}`);
        });

        stream.on('error', reject);
    });
}

module.exports = { generateContractPDF };