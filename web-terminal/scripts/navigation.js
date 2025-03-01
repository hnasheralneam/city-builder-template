const directory = {
   "/": {
      "home": {
         "you": {
            "file1.txt": "hai!",
            "file2.txt": "testing, testing"
         }
      },
      "etc": {
         "terminal": {
            "config.txt": "# nothing here yet"
         }
      }
   }
}
let pwd = "/home/you";

/* what a file would look like
{
   type: text/graphic/markdown,
   contents: "file contents",
   name: "file name",
   directory: "/home/x"
}

also add tab completion!
*/

function listDirectory() {
   let current = getCurrentDirectory();
   let output = "";
   for (let key in current) {
      output += key + " &nbsp; ";
   }
   newLine(output);
}

function readFile(file) {
   let current = getCurrentDirectory();
   let output = current[file];
   if (output) {
      newLine(output);
   } else {
      newLine("could not find file <b>" + file + "</b>");
   }
}

function getCurrentDirectory() {
   let currentDirectory = pwd.split("/").filter((x) => x);
   let current = directory["/"][currentDirectory[0]];
   for (let i = 1; i < currentDirectory.length; i++) {
      current = current[currentDirectory[i]];
   }
   return current;
}