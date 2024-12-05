import axios from "axios";
import * as cheerio from "cheerio";
import { extractPrice, extractCurrency, extractDescription } from "../utils";
// import { extractCurrency } from "@/ScrapeMaster-AI/lib/utils";

export async function scrapeAmazonProduct(productURL: string) {
    if(!productURL) return;

    
    // BrightData proy config
    const username = String(process.env.BRIGHTDATA_USERNAME);
    const password = String(process.env.BRIGHTDATA_PASSWORD);
    const port = 22225;
    const session_id = Math.floor(Math.random() * 10000) | 0;
    
    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password,
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
    }
     try {
        // Fetch the Product Page
        const response = await axios.get(productURL, options);
        const $ = cheerio.load(response.data);

        // Extract the Product Details
        const title = $('#productTitle').text().trim();
        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('a.size.base.a-color-price'),
            $('.a-butotn-selected .a-color-base'),
            // $('.a-price.a-text-price')
        )

        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
        )

        const outOfStock = $('#availability span').text().trim() === 'Currently unavailable';
        const images = $('#imgBlkFront').attr('data-a-dynamic-image') || 
                      $('#landingImage').attr('data-a-dynamic-image') || '{}';

        const imageUrls = Object.keys(JSON.parse(images))

        const currency = extractCurrency($('.a-price-symbol'));

        const discountRate = $('.savingPercentage').text().replace(/[-%]/g, '');
        
        const description = extractDescription($);

        // console.log({title, currentPrice, originalPrice, outOfStock, imageUrls, currency, discountRate});

        const data = {
            url: productURL,
            currency: currency || '$',
            image: imageUrls[0],
            title,
            currentPrice: Number(currentPrice) || Number(originalPrice),
            originalPrice: Number(originalPrice) || Number(currentPrice),
            pricehistory: [],
            discountRate: Number(discountRate),
            category: 'category',
            reviewsCount: 100,
            stars: 4.5,
            isOutOfStock: outOfStock,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(currentPrice) || Number(originalPrice),
            average: Number(currentPrice) || Number(originalPrice),

        }
        
     } catch (error:any) {
        throw new Error(`Failed to scrape product: ${error.message}`);
        
     }
}