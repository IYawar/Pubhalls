function droplist(){
    document.getElementById("mydroplist").classList.toggle("show")
}

window.onclick = function(event) {
    if(!event.target.matches('.dbut')){
        let drops = document.getElementsByClassName("drop-content");
        for(let i = 0; i < drops; i++){
            let openDropdown = drops[i];
            if (openDropdown.classList.contains('show')){
                openDropdown.classList.remove('show');
            }
        }
    }
}
let apiLink = "https://a.vibot.tech:3002/api/afkchecks"
async function getdata() {
    const response = await fetch("https://a.vibot.tech:3002/api/afkchecks")
    const data = await response.json()
    return data
}

window.onload = leggo
let rectang = document.createElement("div")
let afk = document.getElementById("pend")
let run = document.getElementById("run")
let boxes = document.getElementsByClassName("rbox")
async function leggo() {
    let activeAfk = [],activeRun = []
    let data = await getdata()
    
    console.log(data)
    for (let i of Object.values(data)) {
        if (i.active === false) activeRun.push(i)
        else activeAfk.push(i)
        //RenderAfk(i, i.active)
        console.log(i.leaderNick)
        
    }
    activeAfk.forEach(afk => RenderAfk(afk, true))
    activeRun.forEach(afk => RenderAfk(afk, false))


function RenderAfk(afkCheck, active) {
 
    if (active)  {
        rectang.innerHTML = `<a href="${afkCheck.url}"" target="_blank"><div class="rbox"><p class="left">${afkCheck.runType.runName} by ${afkCheck.leaderNick}</p><p class="mid">6:00</p><p class="right">${afkCheck.vcSize || '0'}/${afkCheck.runType.vcCap}</p></div></a>`
        afk.append(rectang)
    } else {
        rectang.innerHTML = `<a href="${afkCheck.url}" target="_blank"><div class="rbox"><p class="left">${afkCheck.runType.runName} by ${afkCheck.leaderNick}</p><p class="mid">xx:xx</p><p class="right">something</p></div></a>`;
        run.append(rectang)
    }
}
}setInterval(leggo, 3000)
/*if (data && Object.keys(data).length) {
    activeAfk.map(afk => RenderAfk(afk, true))
    activeRun.map(afk => RenderAfk(afk, false))
}
}setInterval(leggo, 3000)
*/
/*function RenderAfk(afkCheck, active) {
    for (let b = 0 ; b <= afkCheck.length; b++){
     if (afkCheck[b].active)  {
         rectang.innerHTML = `<a href="${afkCheck.url}"" target="_blank"><div class="rbox"><p class="left">${afkCheck.runType.runName} by ${afkCheck.leaderNick}</p><p class="mid">6:00</p><p class="right">${afkCheck.vcSize || '0'}/45</p></div></a>`
         afk.append(rectang)
     } else if (afkCheck[b].active === false){
         rectang.innerHTML = `<a href="${afkCheck.url}" target="_blank"><div class="rbox"><p class="left">${afkCheck.runType.runName} by ${afkCheck.leaderNick}</p><p class="mid">xx:xx</p><p class="right">${afkCheck.vcSize || '0'}/45</p></div></a>`;
         run.append(rectang)
     }
     } */