exports.addToCart = (req, product) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existing = req.session.cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        req.session.cart.push({
            id: product.id,
            name: product.name,
            cost: product.cost,
            quantity: 1
        });
    }
};

exports.getCart = (req) => {
    return req.session.cart || [];
};