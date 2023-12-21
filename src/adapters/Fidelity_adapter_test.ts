import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { BrokerTransaction } from "../broker_adapter.ts";
import { CurrencyCode } from "../enums.ts";
import { FidelityAdapter } from "./Fidelity_adapter.ts";

Deno.test({
    name: "Fidelity adapter converting csv to taxable transactions",
    permissions: {
        read: true,
    },
    fn: async () => {
        const data = await Deno.readFile("src/adapters/Fidelity_adapter_test.csv");
        const brokerTransactions = await FidelityAdapter(new Blob([data]));

        assertEquals(brokerTransactions[0], <BrokerTransaction> {
            date: new Date("2023-12-14"),
            isin: "ALPHABET INC",
            currency: CurrencyCode.USD,
            value: 222_22,
        });
        assertEquals(brokerTransactions[1], <BrokerTransaction> {
            date: new Date("2023-12-13"),
            isin: "ALPHABET INC",
            currency: CurrencyCode.USD,
            value: 111_11,
        });
        assertEquals(brokerTransactions[2], <BrokerTransaction> {
            date: new Date("2023-12-05"),
            isin: "ALPHABET INC",
            currency: CurrencyCode.USD,
            value: 111_11,
        });
        assertEquals(brokerTransactions[3], <BrokerTransaction> {
            date: new Date("2023-11-30"),
            isin: "ALPHABET INC",
            currency: CurrencyCode.USD,
            value: 1000_00,
        });
    },
});
