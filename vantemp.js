var templateIncludes = [
   'app/views/create_plan.html'
];

var fs = require('fs');
var jsdom = require("jsdom");

function stringEscape(string) {
   string = string.replace(/"/g, '\\"');
   string = string.replace(/\n/g, '"+\n"');
   return string;
}

function templateNode(node, parent, count) {
   var isRoot = false;
   if (parent === undefined) {
      isRoot = true;
      parent = 0;
      count = {c:0};
      tmpl += "var p" + count.c + " = document.createDocumentFragment();\n";
      tmpl += "var el = p" + count.c + ";\n";
   }
   
   var tmpl = "";
   var child = count.c;

   if (node.nodeType == 1 /*Node.ELEMENT_NODE*/) {
      if (node.tagName !== "BODY") {
         tmpl += 'var p' + child + ' = document.createElement("'+node.tagName+'");\n';
         tmpl += 'el = p' + child + ';\n';
         //add attributes
         for (var attr = 0; attr < node.attributes.length; attr++) {
            var attribute = node.attributes[attr];
            tmpl += 'el.setAttribute("' + attribute.name +'", "' + attribute.value + '");\n';
         }
         if (child > 0) {
            tmpl += "p" + parent + ".appendChild(p"+child+");\n";
         }
      } else {
         count.c--;
      }
      for (var i in node.childNodes) {
         count.c++;
         tmpl += templateNode(node.childNodes[i], child, count);
      }
   } else if (node.nodeType == 8 /*Node.COMMENT_NODE*/) {
      if (node.data && node.data.length > 0) {
         if (node.data.indexOf("- ") == 0) {
            tmpl += node.data.substr(2) + "\n";
         } else if (node.data.indexOf("$ ") == 0) {
            tmpl += node.data.substr(2) + "\n";
         } else if (node.data.indexOf("= ") == 0) {
            tmpl += 'el.textContent = ' + node.data.substr(2) + ';\n';
         }
      }
   } else if (node.nodeType == 3 /*Node.TEXT_NODE*/) {
      if (node.textContent.trim().length > 0) {
         tmpl += 'var p' + child + ' = document.createTextNode("' + stringEscape(node.textContent) + '");\n';
         tmpl += 'el = p' + child + ';\n';
         if (child > 0) {
            tmpl += "p" + parent + ".appendChild(p"+child+");\n";
         }
      }
   }

   if (isRoot) {
      tmpl += "return p0;"
   }

   return tmpl;
}

var allTemplates = [];

function writeTemplates() {
   var out = "window.Template = {\n" + allTemplates.join(",\n") + "\n};";
   fs.writeFile("app/views/out.js", out, function(err) {

   });
}

for (var i in templateIncludes) {
   (function(fileName) {
      fs.readFile(fileName, 'utf8', function (err,data) {
         jsdom.env(data, [], function(errors, window) {
            var template = templateNode(window.document.body);
            var templateName = fileName.split('/').pop().split('.html')[0];
            template = "   " + template.replace(/\n/g, "\n   ");
            template = templateName + 'Template: function() {\n' + template + '\n}\n';
            allTemplates.push(template);
            if (allTemplates.length == templateIncludes.length) {
               writeTemplates();
            }
         });
      });

   })(templateIncludes[i]);
}
