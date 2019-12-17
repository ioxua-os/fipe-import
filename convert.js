
const fs = require("fs").promises;
const uuid = require("uuid");

const sqlBaseDir = "./sql";
const dataBaseDir = "./data/carros";


async function sqlizeBrands() {
    const brands = await fs.readFile(`${dataBaseDir}/marcas.json`).then(JSON.parse);

    const sqlHeader = "INSERT INTO _make (hash, creation_date, created_by, last_update, last_modified_by, deleted, name, fipe_id, type) VALUES\n";

    let sql = "";
    const brandCodes = [];

    for (const brand of brands) {
        sql += `${sqlHeader}  ('${uuid()}', now(), 1, now(), 1, FALSE, '${brand.nome}', '${brand.codigo}', 'CAR_OR_UTILITARY');\n\n`;
        brandCodes.push(brand.codigo);
    }

    await fs.writeFile(`${sqlBaseDir}/marcas.sql`, sql);
    return brandCodes;
}


async function sqlizeBrandModels(brandCodes) {
    const sqlHeader = "INSERT INTO _model (hash, creation_date, created_by, last_update, last_modified_by, deleted, name, fipe_id, make)\n";

    let sql = "";

    const brandModelCodePairs = [];

    for (const brandCode of brandCodes) {
        const brandModels = await fs.readFile(`${dataBaseDir}/marca_${brandCode}_modelos.json`).then(JSON.parse);

        for (const model of brandModels.modelos) {
            sql += sqlHeader;
            sql += `  SELECT '${uuid()}', now(), 1, now(), 1, FALSE, '${model.nome}', '${model.codigo}', _make.id\n`;
            sql += `    FROM _make WHERE _make.fipe_id = '${brandCode}';\n\n`;

            brandModelCodePairs.push([brandCode, model.codigo]);
        }

        sql += "\n";

    }

    await fs.writeFile(`${sqlBaseDir}/modelos.sql`, sql);
    return brandModelCodePairs;
}

async function sqlizeModelYears(brandModelCodePairs) {
    const sqlHeader = "INSERT INTO _model_year (hash, creation_date, created_by, last_update, last_modified_by, deleted, name, fipe_id, model)\n";

    let sql = "";

    for (const [brandCode, modelCode] of brandModelCodePairs) {
        const modelYears = await fs.readFile(`${dataBaseDir}/marca_${brandCode}_modelo_${modelCode}_anos.json`)
            .then(JSON.parse);

        for (const model of modelYears) {
            sql += sqlHeader;
            sql += `  SELECT '${uuid()}', now(), 1, now(), 1, FALSE, '${model.nome}', '${model.codigo}', _model.id\n`;
            sql += `    FROM _model WHERE _model.fipe_id = '${modelCode}';\n\n`;
        }

        sql += "\n";

    }

    await fs.writeFile(`${sqlBaseDir}/anos.sql`, sql);
}

async function main() {
    const brandCodes = await sqlizeBrands();

    const brandModelCodePairs = await sqlizeBrandModels(brandCodes);

    await sqlizeModelYears(brandModelCodePairs);
}

main().then(_ => {
    console.log("FINISHED!");
});