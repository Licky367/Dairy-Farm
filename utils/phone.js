exports.formatPhone = (phone) => {

    if (!phone) return null;

    phone = phone.replace(/\s+/g, "");

    if (phone.startsWith("07")) {
        return "254" + phone.slice(1);
    }

    if (phone.startsWith("+254")) {
        return phone.replace("+", "");
    }

    if (phone.startsWith("254")) {
        return phone;
    }

    return null;
};