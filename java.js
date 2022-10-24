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
async function leggo() {
    let activeAfk = [],activeRun = []
    let data = await getdata()
    console.log(data)
    for (let i in data) {
        if (data[i].active) activeRun.push(data[i])
        else activeAfk.push(data[i])
        let leader = data[i].leaderNick
        console.log(leader)
        
    }(i);
    if (data && Object.keys(data).length) {
        function RenderAfk(afkCheck, active) {
            let started
            let rectang = document.createElement("div")
            let afk = document.getElementById("pend")
            let run = document.getElementById("run")
            if (active)  {
                rectang.innerHTML = `<strong class='white'>Ayo mr ${afkCheck.leaderNick} check this out</strong>`;
                afk.append(rectang)
            } else {
                rectang.innerHTML = `<strong class='white'>Bruh by ${afkCheck.leaderNick} </strong>`;
                run.append(rectang)
            }
        }
        RenderAfk(data[i], data[i].active)
        }
}

setInterval(leggo, 3000)

