const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const app = require('../../app/src/server');

describe('E2E - navigation ShopNow', function () {
    this.timeout(30000);

    let driver;
    let server;
    let baseUrl;

    before(async function () {
        const options = new chrome.Options();

        const chromeBinary = process.platform === 'win32'
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : (process.env.CHROME_BIN || '/usr/bin/chromium');
        options.setChromeBinaryPath(chromeBinary);
        options.addArguments(
            '--headless=new',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1280,720'
        );

        server = await new Promise((resolve, reject) => {
            const runningServer = app.listen(0, () => resolve(runningServer));
            runningServer.on('error', reject);
        });
        baseUrl = `http://localhost:${server.address().port}`;

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => error ? reject(error) : resolve());
            });
        }
    });

    it('doit accéder à la page des produits', async function () {

        // Ouvrir ShopNow
        await driver.get(baseUrl);

        // Attendre le lien Produits
        const productsLink = await driver.wait(
            until.elementLocated(
                By.css('[data-testid="products-link"]')
            ),
            10000
        );

        // Vérifier qu'il est visible
        await driver.wait(
            until.elementIsVisible(productsLink),
            10000
        );

        // Cliquer sur Produits
        await productsLink.click();

        // Attendre l'URL
        await driver.wait(
            until.urlContains('products'),
            10000
        );

        // Attendre la page Produits
        const productsPage = await driver.wait(
            until.elementLocated(
                By.css('[data-testid="products-page"]')
            ),
            10000
        );

        // Vérifier que la page est visible
        await driver.wait(
            until.elementIsVisible(productsPage),
            10000
        );

        // Assertions
        expect(await productsPage.isDisplayed()).to.equal(true);

        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.include('products');
    });

    it('doit permettre d acheter un produit et de gerer le panier', async function () {
        await driver.get(baseUrl);
        await driver.executeScript('localStorage.clear();');

        await driver.findElement(By.css('[data-testid="login-link"]')).click();
        await driver.wait(until.urlContains('login'), 10000);
        expect(await driver.getCurrentUrl()).to.contain('login');

        await driver.findElement(By.css('[data-testid="login-submit"]')).click();
        await driver.wait(until.urlContains('products'), 10000);
        const productsPage = await driver.wait(
            until.elementLocated(By.css('[data-testid="products-page"]')),
            10000
        );
        expect(await productsPage.isDisplayed()).to.equal(true);

        await driver.findElement(By.css('[data-testid="view-product-1"]')).click();
        await driver.wait(until.urlContains('product.html?id=1'), 10000);
        const productPage = await driver.wait(
            until.elementLocated(By.css('[data-testid="product-page"]')),
            10000
        );
        expect(await productPage.isDisplayed()).to.equal(true);
        expect(await driver.findElement(By.css('[data-testid="product-name"]')).getText())
            .to.equal('Laptop Pro 14"');

        await driver.findElement(By.css('[data-testid="add-to-cart-1"]')).click();
        await driver.switchTo().alert().accept();

        const cartCount = await driver.wait(
            until.elementLocated(By.css('[data-testid="cart-count"]')),
            10000
        );
        await driver.wait(async () => (await cartCount.getText()) === '1', 10000);
        expect(await cartCount.getText()).to.equal('1');

        await driver.findElement(By.css('[data-testid="cart-link"]')).click();
        await driver.wait(until.urlContains('cart.html'), 10000);
        expect(await driver.findElement(By.css('[data-testid="cart-item-1"]')).isDisplayed())
            .to.equal(true);

        const quantitySelector = By.css('[data-testid="quantity-1"]');
        expect(await driver.findElement(quantitySelector).getText()).to.equal('1');

        await driver.findElement(By.css('[data-testid="increase-1"]')).click();
        await driver.wait(async () => (
            await driver.findElement(quantitySelector).getText()
        ) === '2', 10000);

        const total = await driver.findElement(By.css('[data-testid="cart-total"]'));
        const totalValue = (await total.getText())
            .replace(/[^\d,.-]/g, '')
            .replace(',', '.');
        expect(totalValue).to.equal('2599.98');

        await driver.findElement(By.css('[data-testid="decrease-1"]')).click();
        await driver.wait(async () => (
            await driver.findElement(quantitySelector).getText()
        ) === '1', 10000);
        expect(await driver.findElement(quantitySelector).getText()).to.equal('1');

        await driver.findElement(By.css('[data-testid="remove-item-1"]')).click();
        await driver.wait(
            until.elementLocated(By.css('[data-testid="empty-cart"]')),
            10000
        );
        expect(await driver.findElement(By.css('[data-testid="empty-cart"]')).isDisplayed())
            .to.equal(true);
        const cartItems = await driver.findElements(By.css('[data-testid^="cart-item-"]'));
        expect(cartItems.length).to.equal(0);
    });

    it('doit refuser une connexion avec un mot de passe incorrect', async function () {
        await driver.get(`${baseUrl}/login.html`);
        await driver.executeScript('localStorage.clear();');

        const email = await driver.findElement(By.css('[data-testid="login-email"]'));
        const password = await driver.findElement(By.css('[data-testid="login-password"]'));
        await email.clear();
        await email.sendKeys('student@shopnow.test');
        await password.clear();
        await password.sendKeys('wrong-password');
        await driver.findElement(By.css('[data-testid="login-submit"]')).click();

        const message = await driver.wait(
            until.elementLocated(By.css('[data-testid="login-message"]')),
            10000
        );
        await driver.wait(until.elementIsVisible(message), 10000);

        expect(await message.isDisplayed()).to.equal(true);
        expect(await message.getText()).to.equal('Email ou mot de passe incorrect');
        expect(await driver.getCurrentUrl()).to.contain('/login.html');
    });
});