const mongoose = require("mongoose")
const accountModel = require("../models/account.model")
const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const emailService = require("../services/email.service")

/**
 * Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 * 1. validate request
 * 2. validate idempotency key
 * 3. check account status
 * 4. derive sender balance from ledger
 * 5. create transaction (PENDING)
 * 6. create DEBIT ledger entry
 * 7. create CREDIT ledger entry
 * 8. mark transaction completed
 * 9. commit mongoDB session
 * 10. send email notification
 */
async function createTransaction(req, res) {
    /**
     * 1. validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    if (amount <= 0) {
        return res.status(400).json({
            message: "Amount must be greater than 0"
        })
    }

    if (String(fromAccount) === String(toAccount)) {
        return res.status(400).json({
            message: "fromAccount and toAccount cannot be the same"
        })
    }

    // sender account must belong to the logged-in user
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
        user: req.user._id
    })
    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    /**
     * 2. validate idempotencyKey
     */
    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETE") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing"
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    /**
     * 3. check account status
     */
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process a transaction"
        })
    }

    /**
     * 4. derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance()
    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}, requested amount is ${amount}`
        })
    }

    /**
     * 5-9. create transaction, ledger entries, commit
     */
    const session = await mongoose.startSession()
    let transaction

    try {
        session.startTransaction()

        const created = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session })
        transaction = created[0]

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })
  await (() =>{
    return new Promise((resolve) => setTimeout(resolve , 15 * 1000));
  })()
        await ledgerModel.create([{
            account: toUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        transaction.status = "COMPLETE"
        await transaction.save({ session })

        await session.commitTransaction()
    } catch (error) {
        await session.abortTransaction()
        return res.status(400).json({ message: "Transaction is pending due to some issue, please retry after some time" })
    } finally {
        session.endSession()
    }

    

    /**
     * 10. send email notification
     * (email failure should not undo a transaction that is already committed)
     */
    try {
        await emailService.sendTransactionEmail(
            req.user.email,
            req.user.name,
            amount,
            toAccount
        )
    } catch (emailErr) {
        console.log("Transaction email failed:", emailErr.message)
    }

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction
    })
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({ _id: toAccount })
    if (!toUserAccount) {
        return res.status(400).json({ message: "Invalid toAccount" })
    }

    const fromUserAccount = await accountModel.findOne({ user: req.user._id })
    if (!fromUserAccount) {
        return res.status(400).json({ message: "System user account not found" })
    }

    const session = await mongoose.startSession()
    try {
        session.startTransaction()

        const [transaction] = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session })

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        transaction.status = "COMPLETE"
        await transaction.save({ session })

        await session.commitTransaction()
        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction
        })
    } catch (err) {
        await session.abortTransaction()
        return res.status(500).json({ message: err.message })
    } finally {
        session.endSession()
    }
    
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}