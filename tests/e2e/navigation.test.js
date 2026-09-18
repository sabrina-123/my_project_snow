const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { expect } = require('chai');
const app = require('../../app/src/server');

describe('E2E - navigation ShopNow', function () {
    this.timeout(30000);

    let driver;
    let server;

    before(async function () {
        const options = new firefox.Options();

        server = await new Promise((resolve, reject) => {
            const runningServer = app.listen(8081, () => resolve(runningServer));
            runningServer.on('error', reject);
        });

        options.setBinary(
            'C:\\Program Files\\Mozilla Firefox\\firefox.exe'
        );

        driver = await new Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(options)
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
        await driver.get('http://localhost:8081');

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
});