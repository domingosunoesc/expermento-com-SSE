const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static('public'));

let orders = [];
let currentId = 1;

// Clientes SSE
const clients = new Set();


// ==========================
// SSE
// ==========================
app.get('/events', (req, res) => {

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.flushHeaders();

    clients.add(res);

    console.log('Cliente conectado SSE');

    // envia estado inicial
    res.write(`data: ${JSON.stringify({
        type: 'INIT',
        orders
    })}\n\n`);

    req.on('close', () => {
        clients.delete(res);
        console.log('Cliente desconectado');
    });
});


// ==========================
// Função Broadcast
// ==========================
function broadcast(data) {

    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
}


// ==========================
// Buscar pedidos
// ==========================
app.get('/api/orders', (req, res) => {
    res.json(orders);
});


// ==========================
// Criar pedido
// ==========================
app.post('/api/orders', (req, res) => {

    const { cliente, item } = req.body;

    const order = {
        id: currentId++,
        cliente,
        item,
        status: 'Pendente'
    };

    orders.push(order);

    broadcast({
        type: 'NEW_ORDER',
        order
    });

    res.json(order);
});


// ==========================
// Atualizar status
// ==========================
app.post('/api/orders/update', (req, res) => {

    const { id, newStatus } = req.body;

    const order = orders.find(o => o.id === id);

    if (!order) {
        return res.status(404).json({
            erro: 'Pedido não encontrado'
        });
    }

    order.status = newStatus;

    broadcast({
        type: 'UPDATE_ORDER',
        order
    });

    res.json(order);
});


// ==========================
// Limpar concluídos
// ==========================
app.delete('/api/orders/completed', (req, res) => {

    orders = orders.filter(o => o.status !== 'Entregue');

    broadcast({
        type: 'CLEANUP_ORDERS'
    });

    res.json({
        sucesso: true
    });
});


const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});