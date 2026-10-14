const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controller/account.controller")
const router = express.Router()

/**
 *  - POST /api/accounts
 * -Create a new Account 
 * -Protected Route
 */
router.post("/" , authMiddleware.authMiddleware, accountController.createAccountController)
 /**
  * - GET /api/accounts/
  * - Get all accounts of the logged-in user
  *  - Protected Routes
  */ 
router.get("/" , authMiddleware.authMiddleware, accountController.getUSerAccountController )
/**
 * -Get /api/accounts/balance/accountID
 * -
*/
router.get("/balance/:accountId" , authMiddleware.authMiddleware, accountController.getAccountBalanceController)


module.exports = router