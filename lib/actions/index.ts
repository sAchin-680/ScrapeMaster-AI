'use server'

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectDB } from "../mogoose";
import { scrapeAmazonProduct } from "../scrapper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { generateEmailBody, sendEmail } from "../nodemailer";

export async function scrapeAndStoreProduct(productURL: string) {
    if (!productURL) return;

    try {
        connectDB()
        const scrapedProduct = await scrapeAmazonProduct(productURL) as unknown as { url: string; currentPrice: number; [key: string]: any };
        if (scrapedProduct === undefined || scrapedProduct === null) return;
        let product = scrapedProduct;
        const existingProduct = await Product.findOne({ url: scrapedProduct.url });
        if (existingProduct) {
            const updatedPriceHistory = [
                ...existingProduct.priceHistory,
                { price: scrapedProduct.currentPrice }
            ];
            product = {
                ...scrapedProduct,
                priceHistory: updatedPriceHistory,
                lowestPrice: getLowestPrice(updatedPriceHistory),
                highestPrice: getHighestPrice(updatedPriceHistory),
                AveragePrice: getAveragePrice(updatedPriceHistory),
            }
        }
        const newProduct = await Product.findOneAndUpdate({
            url: scrapedProduct.url},
            product, 
            { upsert: true, new: true }
        )
        // console.log('Scraped Product:', scrapedProduct);
        revalidatePath(`/products/${newProduct._id}`);
    } catch (error:any) {
        throw new Error(`Failed to create product: ${error.message}`);
    }
}

export async function getProductById(productId: string) {
    try {
        connectDB();
        const product = await Product.findOne({ _id: productId });

        if (!product) return null;
        
        return product;
    } catch (error:any) {
        console.log(error);
        }
}

export async function getAllProducts() {
    try {
        connectDB();

        const products = await Product.find({});

        return products;
    } catch (error) {
        console.log(error)
    }
}

export async function getSimilarProducts(productId: string) {
    try {
        connectDB();

        const currentProduct = await Product.findById(productId);
        if (!currentProduct) return null;
        const similarProducts = await Product.find({ _id: { $ne: productId } }).limit(3);
        return similarProducts;
    } catch (error) {
        console.log(error);
    }
}

export async function addUserEmailToProduct(productId: string, userEmail: string) {
    try {
        // Send email to user
        const product = await Product.findById(productId);
        if(!product) return;

        const userExists = product.users.some((user: { email: string }) => user.email === userEmail);
        if(!userExists) {
            product.users.push({ email: userEmail });

            await product.save();

            const WELCOME_NOTIFICATION = 'WELCOME';
            const emailContent = await generateEmailBody(product, WELCOME_NOTIFICATION);
            
            await sendEmail(emailContent, [userEmail]);
        }
    } catch (error) {
        console.log(error);
        
    }
}