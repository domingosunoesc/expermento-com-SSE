const orderList = document.getElementById('order-list');


// ==========================
// SSE
// ==========================
const eventSource = new EventSource('/events');


function getStatusClass(status) {

    if (status === 'Preparando') return 'status-preparando';

    if (status === 'Saiu para Entrega') return 'status-saiu';

    if (status === 'Entregue') return 'status-entregue';

    return 'status-pendente';
}


function renderOrder(order) {

    let el = document.getElementById(`order-${order.id}`);

    if (!el) {

        el = document.createElement('div');

        el.id = `order-${order.id}`;

        orderList.prepend(el);
    }

    el.className = `order-card ${getStatusClass(order.status)}`;

    el.innerHTML = `
        <small>Pedido #${order.id}</small>
        <h2 style="margin: 5px 0;">👤 ${order.cliente}</h2>
        <p>📦 Item: ${order.item}</p>
        <strong>Status: ${order.status}</strong>
    `;
}


// ==========================
// Receber eventos SSE
// ==========================
eventSource.onmessage = (event) => {

    const data = JSON.parse(event.data);


    if (data.type === 'INIT') {

        orderList.innerHTML = '';

        data.orders.forEach(renderOrder);
    }


    if (data.type === 'NEW_ORDER') {

        renderOrder(data.order);
    }


    if (data.type === 'UPDATE_ORDER') {

        renderOrder(data.order);
    }


    if (data.type === 'CLEANUP_ORDERS') {

        orderList.innerHTML = '';
    }
};


// ==========================
// Conexão aberta
// ==========================
eventSource.onopen = () => {

    console.log('Conectado ao SSE');
};


// ==========================
// Erro
// ==========================
eventSource.onerror = (err) => {

    console.error('Erro SSE:', err);
};