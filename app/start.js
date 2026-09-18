const { startServer } = require('./src/server');

const port = process.env.PORT || 8080;
const server = startServer(port);
server.on('listening', () => {
	console.log(`ShopNow running on http://localhost:${port}`);
});