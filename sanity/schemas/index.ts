import author from "./author";
import blockContent from "./blockContent";
import category from "./category";
import post from "./post";
import code from "./code";
import table from "./table";
import product from "./product";
import poeItem from "./poe-item";
import buildGuide from "./buildGuide";
import buildOverview, { contentSection } from "./buildOverview";
import leagueLanding from "./leagueLanding";
import localeString from "./localeString";
import localeText from "./localeText";

const schemas = [
  post,
  author,
  category,
  blockContent,
  code,
  table,
  product,
  poeItem,
  buildGuide,
  contentSection,
  buildOverview,
  leagueLanding,
  localeString,
  localeText,
];

export default schemas;