exports.addToCart = (req, product) => {
    if (!req.session.cart) req.session.cart = [];

    const cart = req.session.cart;

    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            cost: product.cost,
            quantity: 1,
            image: product.image
        });
    }

    req.session.cart = cart;
};

exports.removeFromCart = (req, id) => {
    req.session.cart = (req.session.cart || []).filter(item => item.id !== id);
};

exports.getTotal = (req) => {
    return (req.session.cart || []).reduce((sum, item) => {
        return sum + item.cost * item.quantity;
    }, 0);
};