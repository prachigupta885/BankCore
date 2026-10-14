const { Router } = require("express");
const authMiddleware = require('../middleware/auth.middleware');

const transactionController = require("../controller/transaction.controller");
const transactionRoutes = Router();
/**
 *  -POST /api/transaction/
 * - Create a new transaction
 */
transactionRoutes.post("/", authMiddleware.authMiddleware);
transactionRoutes.post("/", transactionController.createTransaction);

/**
 * -POST /api/transaction/system/initial-funds
 * -Create INITAL fund transaction from system user
 * 
 */

transactionRoutes.post("/system/initial-funds" , authMiddleware.authSystemMiddleware , transactionController.createInitialFundsTransaction
)
module.exports = transactionRoutes;