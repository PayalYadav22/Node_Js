import fs from 'fs'

// File Write Method

// fs.writeFileSync('./test.html', "<h1>Hello World</h1>");

// fs.writeFile('./about.html', "<h1>Hello World</h1>", (err) => {
//     if(!err) console.log('All Good');
//     if(err) console.log(err)
// });

// File Read Method
// console.log(fs.readFileSync('./contact.txt', "utf-8"))

// fs.readFile('./contact.txt', "utf-8", (err, result) => {
//     if(!err) console.log(result)
//     if(err) console.log(`${err}`)
// });

// File Append Method
fs.appendFileSync('./contact.txt',new Date().getDate().toLocaleString()+ '\n');