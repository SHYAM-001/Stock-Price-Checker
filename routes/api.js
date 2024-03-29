"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var db = require("../db/mongoose");
var Stock = require("../models/stockModel");
var stockPrice = require("../controllers/stockHandler");

// Initialize cache
var cache = {};

module.exports = function(app) {
  app.route("/api/stock-prices").get(async (req, res) => {
    const { query } = req;
    let like = query.like === "true" ? true : false;
    let ipAdd = like ? req.ip : "-1";
    const stocks = query.stock;

    try {
      if (Array.isArray(stocks)) {
        const promise = stocks.map(async stock => {
          const stockSymbol = stock.toUpperCase();
          const closingPrice = await getStockPrice(stockSymbol);
          const doc = await updateDBase({ stockSymbol, closingPrice, ipAdd });
          return doc;
        });

        let stockData = await Promise.all(promise);
        const result = findAndReturnData(stockData);
        return res.send(result);
      }

      if (!Array.isArray(stocks)) {
        const stockSymbol = stocks.toUpperCase();
        const closingPrice = await getStockPrice(stockSymbol);
        const doc = await updateDBase({ stockSymbol, closingPrice, ipAdd });
        const result = findAndReturnData(doc);
        return res.send(result);
      }
    } catch (error) {
      res.json(error);
    }
  });
};

async function getStockPrice(stockSymbol) {
  // Check if the data is in the cache
  if (cache[stockSymbol]) {
    return cache[stockSymbol];
  }

  // If not, fetch the data
  const closingPrice = await stockPrice.getStockPrice(stockSymbol);

  // Store the data in the cache
  cache[stockSymbol] = closingPrice;

  return closingPrice;
}

async function updateDBase(props) {
  const { stockSymbol, closingPrice, ipAdd } = props;

  try {
    let doc = await Stock.findOneAndUpdate(
      { stock: stockSymbol },
      { price: closingPrice, $addToSet: { favourite: ipAdd } },
      { new: true, upsert: true }
    );
    return doc;
  } catch (error) {
    throw error;
  }
}

function findAndReturnData(stocks) {
  stocks = [].concat(stocks);
  const numberOfStocks = stocks.length;

  let stockData = [];

  if (numberOfStocks == 1) {
    let stock = {
      stockData: {
        stock: stocks[0].stock,
        price: stocks[0].price,
        likes:
          stocks[0].favourite.indexOf("-1") == -1
            ? stocks[0].favourite.length
            : stocks[0].favourite.length - 1
      }
    };
    return stock;
  }

  if (numberOfStocks > 1) {
    stocks.forEach((stock, idx) => {
      stockData.push({
        stock: stock.stock,
        price: stock.price,
        rel_likes:
          stocks[idx].favourite.indexOf("-1") == -1
            ? stock.favourite.length
            : stock.favourite.length - 1
      });
    });
    return { stockData };
  }
}
