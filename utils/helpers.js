class Helpers {
    formatDate(date) {
        const d = new Date(date);
        return d.toISOString().slice(0, 10);
    }

    formatTime(date) {
        const d = new Date(date);
        return d.toTimeString().slice(0, 5);
    }

    formatDateTime(date) {
        const d = new Date(date);
        return `${this.formatDate(d)} ${this.formatTime(d)}`;
    }

    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
        }
        return phone;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }

    generateCode(length = 6) {
        return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
    }

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    }

    pluralize(count, words) {
        const cases = [2, 0, 1, 1, 1, 2];
        return words[
            count % 100 > 4 && count % 100 < 20
                ? 2
                : cases[Math.min(count % 10, 5)]
        ];
    }

    safeJSONParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch {
            return defaultValue;
        }
    }

    paginate(data, page = 1, limit = 10) {
        const start = (page - 1) * limit;
        const end = start + limit;
        
        return {
            data: data.slice(start, end),
            total: data.length,
            page,
            limit,
            totalPages: Math.ceil(data.length / limit)
        };
    }

    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    }
}

module.exports = new Helpers();