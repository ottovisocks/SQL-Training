import { Database } from "../src/database";
import { minutes } from "./utils";
import {
    APPS,
    APPS_CATEGORIES,
    CATEGORIES,
    PRICING_PLANS,
    APPS_PRICING_PLANS
} from "../src/shopify-table-names";

describe("Queries Across Tables", () => {
    let db: Database;

    beforeAll(async () => {
        db = await Database.fromExisting("03", "04");
    }, minutes(1));

    it("should select count of apps which have free pricing plan", async done => {
        const query = `
            SELECT COUNT (*) AS count
                FROM ${APPS} a
                JOIN ${APPS_PRICING_PLANS} app ON app.app_id = a.id
                JOIN ${PRICING_PLANS} pp ON pp.id = app.pricing_plan_id
                WHERE pp.price = 'Free' OR pp.price = 'Free to install'
            `;

        const result = await db.selectSingleRow(query);
        expect(result).toEqual({
            count: 1112
        });
        done();
    }, minutes(1));

    it("should select top 3 most common categories", async done => {
        const query = `
            SELECT COUNT (*) AS count, title AS category
                FROM ${APPS_CATEGORIES} ac
                JOIN ${CATEGORIES} c ON c.id = ac.category_id
                GROUP BY category_id
                LIMIT 3
            `;

        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 1193, category: "Store design" },
            { count: 723, category: "Sales and conversion optimization" },
            { count: 629, category: "Marketing" }
        ]);
        done();
    }, minutes(1));

    it("should select top 3 prices by appearance in apps and in price range from $5 to $10 inclusive (not matters monthly or one time payment)", async done => {
        const query = `
            SELECT price, CAST(REPLACE(REPLACE(REPLACE(price,'$',''),'/month',''),' one time charge', '') AS REAL) AS casted_price, COUNT (*) AS count
                FROM ${APPS_PRICING_PLANS} app
                JOIN ${PRICING_PLANS} pp ON pp.id = app.pricing_plan_id
                WHERE casted_price >= 5 AND casted_price <= 10
                GROUP BY casted_price
                ORDER BY count DESC
                LIMIT 3
            `;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 225, price: "$9.99/month", casted_price: 9.99 },
            { count: 135, price: "$5/month", casted_price: 5 },
            { count: 114, price: "$10/month", casted_price: 10 }
        ]);
        done();
    }, minutes(1));
});