'use server'

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { scrapeAmazonProduct } from "../scrapper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { generateEmailBody, sendEmail } from "../nodemailer";
import { connectDB } from "../mogoose";

export async function scrapeAndStoreProduct(productURL: string) {
    if (!productURL) return;

    try {
        await connectDB();
        const scrapedProduct = await scrapeAmazonProduct(productURL) as unknown as { url: string; currentPrice: number; [key: string]: any };
        if (!scrapedProduct) return;

        let product = scrapedProduct;
        const existingProduct = await Product.findOne({ url: scrapedProduct.url });
        if (existingProduct) {
            const updatedPriceHistory = [
                ...existingProduct.priceHistory,
                { price: scrapedProduct.currentPrice, date: new Date() }
            ];
            product = {
                ...scrapedProduct,
                priceHistory: updatedPriceHistory,
                lowestPrice: getLowestPrice(updatedPriceHistory),
                highestPrice: getHighestPrice(updatedPriceHistory),
                averagePrice: getAveragePrice(updatedPriceHistory),
            };
            await Product.updateOne({ url: scrapedProduct.url }, product);
        } else {
            const newProduct = new Product({
                ...scrapedProduct,
                priceHistory: [{ price: scrapedProduct.currentPrice, date: new Date() }],
                lowestPrice: scrapedProduct.currentPrice,
                highestPrice: scrapedProduct.currentPrice,
                averagePrice: scrapedProduct.currentPrice,
            });
            await newProduct.save();
        }

        console.log('Scraped Product:', product);
        
    } catch (error: any) {
        throw new Error(`Failed to create product: ${error.message}`);
    }
}

export async function getAllProducts() {
    try {
        await connectDB();

        const products = await Product.find({});

        return products;
    } catch (error: any) {
        console.log(error);
        throw new Error(`Failed to get products: ${error.message}`);
    }
}