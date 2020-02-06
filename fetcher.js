const fs = require('fs');
const dotenv = require('dotenv')
const webdriver = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');

dotenv.config();

const CPF_TEST = '03072914486';
const username = process.env.SOROCRED_USERNAME;
const password = process.env.SOROCRED_PASSWORD;
const landingPage = process.env.SOROCRED_LANDING_PAGE;
const proposalsPage = process.env.SOROCRED_PROPOSALS_PAGE;

const ONE_SECOND = 1000;

// webdriver halters
const By = webdriver.By;
const until = webdriver.until;

const options = new firefox.Options();

const getProposals = async (cpfList, driver = null) => {
    driver = driver
        ? driver
        : new webdriver.Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(options)
            .build();

    let proposals = [];

    await driver.get(landingPage)

    // Login
    await driver.wait(until.elementLocated(By.id('EUsuario_CAMPO')), 10 * ONE_SECOND)
        .then(usernameInput => usernameInput.sendKeys(username));

    await driver.wait(until.elementLocated(By.id('ESenha_CAMPO')), 10 * ONE_SECOND)
        .then(passwordInput => passwordInput.sendKeys(password));

    await driver.wait(until.elementLocated(By.id('LKentrar')), 10 * ONE_SECOND)
        .then(loginButton => loginButton.click());

    // Proposals
    await driver.get(proposalsPage)

    for (cpf of cpfList) {
        await driver.wait(until.elementLocated(By.id('ctl00_Cph_AprCons_cbxPesquisaPor_CAMPO')), 10 * ONE_SECOND)
        .then(searchForSelect => searchForSelect.sendKeys('Cpf'));

        await driver.sleep(2 * ONE_SECOND);

        await driver.wait(until.elementLocated(By.id('ctl00_Cph_AprCons_txtPesquisa_CAMPO')), 10 * ONE_SECOND)
            .then(searchTextInput => searchTextInput.sendKeys(cpf));

        await driver.wait(until.elementLocated(By.id('btnPesquisar_txt')), 10 * ONE_SECOND)
            .then(searchButton => searchButton.click());

        await driver.wait(
            until.elementLocated(
                By.css(
                    '#ctl00_Cph_AprCons_grdConsulta > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(1) > a:nth-child(1)'
                )), 10 * ONE_SECOND)
            .then(proposalLink => proposalLink.getAttribute('innerHTML').then(proposalNumber => proposals.push(proposalNumber)));

        await driver.sleep(ONE_SECOND);

        await driver.navigate().refresh();

        await driver.wait(until.elementLocated(By.id('ctl00_Cph_AprCons_txtPesquisa_CAMPO')), 10 * ONE_SECOND)
            .then(searchTextInput => searchTextInput.clear());

        await driver.sleep(2 * ONE_SECOND);
    }

    proposals.forEach(proposalNumber => {
        fs.appendFileSync('propostas_sorocred.txt', `${proposalNumber}\n`);
    });

    await driver.quit();
}

cpfList = fs.readFileSync('cpf_list.txt', { encoding: 'utf8' }).split('\n')
            .filter(cpf => cpf !== '');

getProposals(cpfList);

