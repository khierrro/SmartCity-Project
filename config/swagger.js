const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const swaggerSpec = yaml.load(
  fs.readFileSync(path.join(__dirname, "..", "smartcity-openapi.yaml"), "utf8")
);

module.exports = swaggerSpec;