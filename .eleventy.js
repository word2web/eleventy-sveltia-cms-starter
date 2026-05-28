const { DateTime } = require("luxon");
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");
const htmlmin = require("html-minifier");
const yaml = require("js-yaml");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const Image = require("@11ty/eleventy-img");

module.exports = function(eleventyConfig) {
  // 1. Pass-through copies
  eleventyConfig.addPassthroughCopy("assets/css");
  eleventyConfig.addPassthroughCopy("assets/img");
  eleventyConfig.addPassthroughCopy("admin/");

  // 2. Plugins
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addDataExtension("yml", contents => yaml.load(contents));
  eleventyConfig.setDataDeepMerge(true);

  // 3. Shortcodes
  eleventyConfig.addShortcode("generateImage", async function(src, alt, sizes) {
    let metadata = await Image(src, {
      widths: [500, 1000, "auto"],
      formats: ["avif", "jpeg", "auto"],
      urlPath: "/assets/img",
      outputDir: "./_site/assets/img/"
    });
    let imageAttributes = { alt, sizes, loading: "lazy", decoding: "async" };
    return Image.generateHTML(metadata, imageAttributes);
  });

  // 4. Filters
  eleventyConfig.addFilter("readableDate", dateObj => DateTime.fromJSDate(dateObj).toFormat("LLL d yyyy"));
  eleventyConfig.addFilter("machineDate", dateObj => DateTime.fromJSDate(dateObj).toFormat("yyyy-MM-dd"));
  eleventyConfig.addFilter("pluralize", (term, count = 1) => count === 1 ? term : `${term}s`);
  eleventyConfig.addFilter("cssmin", code => new CleanCSS({}).minify(code).styles);
  eleventyConfig.addFilter("jsmin", code => {
    let minified = UglifyJS.minify(code);
    return minified.error ? code : minified.code;
  });

  // 5. Transforms
  eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
    }
    return content;
  });

  // 6. Settings
  eleventyConfig.setServerOptions({ liveReload: false });

  // 7. Final Return Statement
  return {
    templateFormats: ["md", "njk", "liquid"],
    pathPrefix: "/",
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};