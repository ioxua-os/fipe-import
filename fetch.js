const request =  require("request-promise-native");
const fs = require("fs").promises;
const uuid = require("uuid");

const type = "carros"; // "caminhoes"
const baseUrl = `https://parallelum.com.br/fipe/api/v1/${type}/marcas`;
const baseDataDir = `./data/${type}`;

async function getOrCache(uri, keys = [uuid()]) {
    const fileKey = keys.join("_");
    const fileName = `${baseDataDir}/${fileKey}.json`;

    try {
        return await fs.readFile(fileName, {
            encoding: "utf8"
        }).then(JSON.parse);
    } catch (e) {
        return await request(uri)
            .then(async result => {
                await fs.writeFile(fileName, result);
                return result;
            }).then(JSON.parse);
    }
}

async function main() {
    const brands = await getOrCache(baseUrl, ["marcas"]);

    for (const brand of brands) {
        const modelsRequestUrl = baseUrl + `/${brand.codigo}/modelos`;
        const brandModels = await getOrCache(modelsRequestUrl, ["marca", brand.codigo, "modelos"]);

        for (const model of brandModels.modelos) {
            const yearsRequestUrl = modelsRequestUrl + `/${model.codigo}/anos`;
            const modelYears = await getOrCache(yearsRequestUrl, ["marca", brand.codigo, "modelo", model.codigo, "anos"]);
            console.log(modelYears)
        }
    }
}


main().then(_ => {
    console.log("FINISHED!");
});
