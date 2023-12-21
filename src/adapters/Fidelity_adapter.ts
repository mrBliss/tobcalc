import { CurrencyCode } from "../enums.ts";
import { BrokerAdapter, BrokerTransaction } from "../broker_adapter.ts";
import { moneyToNumber } from "../broker_reading.ts";
import { InformativeError } from "../InformativeError.ts";

const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export const FidelityAdapter: BrokerAdapter = async data => {
    const text = await data.text();

    const rows = text.split(/\r?\n/);

    const columnNames = rows[0].split(",");

    const transactionDateColumnIndex = columnNames.indexOf(`Transaction date`);
    const transactionTypeColumnIndex = columnNames.indexOf(`Transaction type`);
    const investmentNameColumnIndex = columnNames.indexOf(`Investment name`);
    const sharesColumnIndex = columnNames.indexOf(`Shares`);
    const amountColumnIndex = columnNames.indexOf(`Amount`);

    if(transactionDateColumnIndex === -1) {
        throw new InformativeError("fidelity_adapter.transaction_date_column_index", columnNames);
    }
    if(transactionTypeColumnIndex === -1) {
        throw new InformativeError("fidelity_adapter.transaction_type_column_index", columnNames);
    }
    if(investmentNameColumnIndex === -1) {
        throw new InformativeError("fidelity_adapter.investment_name_column_index", columnNames);
    }
    if(sharesColumnIndex === -1) {
        throw new InformativeError("fidelity_adapter.shares_column_index", columnNames);
    }
    if(amountColumnIndex === -1) {
        throw new InformativeError("fidelity_adapter.amount_column_index", columnNames);
    }

    const brokerTransactions: BrokerTransaction[] = [];
    for(const rowString of rows.slice(1)) {
        if(rowString === "") {
            break;
        }

        const row = rowString.split(",");
        // Ignore sell to cover transactions, which have type:
        // "YOU SOLD CROSS TRADE EXEC ON MULT EXCHG DETAILS ON REQUEST"
        if(row[transactionTypeColumnIndex] !== `YOU SOLD` && row[transactionTypeColumnIndex].indexOf(`YOU BOUGHT`) === -1) {
            continue;
        }

        const dateString = row[transactionDateColumnIndex];

        if(row[investmentNameColumnIndex] === undefined) {
            throw new InformativeError("fidelity_adapter.investment_name_undefined", { row, columnNames });
        }
        if(row[amountColumnIndex] === undefined) {
            throw new InformativeError("fidelity_adapter.amount_undefined", { row, columnNames });
        }

        brokerTransactions.push({
            // Date is in format Mon-DD-YYYY
            // For example: Dec-14-2023
            date: new Date(`${dateString.substring(7, 11)}-${monthNames.indexOf(dateString.substring(0, 3).toLowerCase())+1}-${dateString.substring(4, 6)}`),
            isin: row[investmentNameColumnIndex],
            currency: CurrencyCode.USD,
            // moneyToNumber() to convert string into number and * 100 to convert into integer
            // Ignore the minus sign, we only care about absolute value of transaction
            value: moneyToNumber(row[amountColumnIndex].replace("-", "").replace("$", "")),
        });
    }
    return brokerTransactions;
};
