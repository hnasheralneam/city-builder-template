// add directories!
// tab to autocomplete
// save bash history in a "file"
// save color configs in a "file"


let commandHistory = [];
let commandHistoryIndex = 0;
let inputElement = document.querySelector(".terminal-input");
inputElement.value = "";
inputElement.focus();



document.querySelector(".terminal-input").addEventListener("keydown", (e) => {
   if (e.keyCode == 38 || e.keyCode == 40) {
      commandHistory.push("");
      if (commandHistory.length == 0) return;
      if (e.keyCode == 38) {
         if (commandHistory[commandHistoryIndex - 1]) commandHistoryIndex--;
      } else {
         if (commandHistoryIndex + 1 < commandHistory.length)
            commandHistoryIndex++;
         else {
            inputElement.value = "";
            commandHistory.pop();
            return;
         }
      }
      inputElement.value = commandHistory[commandHistoryIndex];
      commandHistory.pop();
   }
   if (e.keyCode != 13) return;

   let input = inputElement.value;
   inputElement.value = "";

   commandHistory.push(input);
   commandHistoryIndex = commandHistory.length;

   let inputLine = document.createElement("div");

   inputLine.innerHTML = `<span class="terminal-text">you@computer:~$&nbsp;<span class="terminal-input" style="inline-block">${input}</span>`;
   newLine(inputLine.innerHTML);

   let keywords = input.split(" ");

   runCommand(keywords, input);
});

function runCommand(keywords, input) {
   let command = keywords[0];
   let commandFunction = commands[command];
   if (commandFunction) {
      commandFunction(keywords);
      return;
   }
   else {
      newLine("could not find command <b>" + input + "</b>");
      newLine("try the command <b>help</b> to see possible commands");
   }
}

function newLine(content, className, options) {
   let line = document.createElement("span");
   line.classList.add("line");
   if (className) line.classList.add(className);
   line.innerHTML = content;
   document.querySelector(".lines").append(line);
   let shell = document.getElementById("shell");
   shell.scrollTop = shell.scrollHeight;

   if (options) {
      newLine("<br>");
      for (let i = 0; i < options.length; i++) {
         newLine(options[i]);
      }
      newLine("<br>");
   }

   return line;
}

function clearTerminal() {
   document.querySelector(".lines").innerHTML = "";
}

function printNeofetch() {
   newLine(
      `
             .%%                             OS: Web Terminal<br>
         %%%%%..%%                           Host: Browser<br>
       %%::...%%                             JS: ES6<br>
       %%::...%%                             Font: Monospace<br>
    %%%::..%%%                               Time: ${new Date().toLocaleTimeString()}<br>
  %%:::::..%%%               :               Date: ${new Date().toLocaleDateString()}<br>
  %%:::==%%                 .:.              <br>
%%:::::..%%             :    .               <br>
%%:::::..%%           .::::.  :              <br>
%%:::::..%%             ::                   <br>
%%::===..%%                                  <br>
%%:::::::::%%%                               <br>
%%:::::::==%%%                       %%      <br>
%%:::::=======%%                  %%%..%%    <br>
%%:::::=======%%                  %%%..%%    <br>
  %%:::::==:::..%%%%+         %%%%...%%      <br>
  %%===:::::::::....=%%%%%%%%%....===%%      <br>
    %%%====::::::::::.........::==%%%        <br>
       %%=========:::::::::-====%%           <br>
       %%=========:::::::::-====%%           <br>
         %%%%%=============#%%%%             <br>
             .%%%%%%%%%%%%%.                 <br>
             `.replace(/ /g, "&nbsp;")
   );
}
