const puppeteer = require("puppeteer");
const axios = require("axios");

// product url
const targetUrl = "https://www.wildberries.ru/catalog/146972802/detail.aspx";

// fetch data from WB
async function fetchData(url) {
    const result = [];

    try {
        const response = await axios.get(url);

        const { products } = response.data.data;

        products.forEach((prod) => {
            const { id, sizes } = prod,
                prodObj = {},
                sizeObj = {};

            // qty of sizes in Kazan WB (id = 117986)
            sizes.forEach((size) => {
                size.stocks.forEach((stock) => {
                    if (stock.wh === 117986) {
                        sizeObj[size.origName] = stock.qty;
                    }
                });
            });

            // add prod to array
            prodObj.art = id;
            prodObj.stock = sizeObj;
            result.push(prodObj);
        });

        // display result in console
        console.log(result);
        return result;
    } catch (error) {
        console.error("Error fetching data:", error.message);
        return;
    }
}

// used Puppeteer for parsing SPA
async function parseSPA(url) {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: "networkidle2" });

        // wait for a list of products with articles
        await page.waitForSelector(".swiper-wrapper");

        // get articles from slider
        const articles = await page.$$eval(
            "ul.swiper-wrapper > li > a",
            (links) => {
                return links.map((link) => link.href.match(/\d+/)[0]);
            }
        );

        // create url for get data in JSON format
        let basicUrlString =
            "https://card.wb.ru/cards/v1/detail?appType=1&curr=rub&dest=-1257786&spp=27&nm=";

        for (let article of articles) {
            basicUrlString += `${article};`;
        }

        fetchData(basicUrlString);

        await browser.close();
    } catch (error) {
        console.error("Error fetching or parsing the web page:", error.message);
    }
}

parseSPA(targetUrl);
