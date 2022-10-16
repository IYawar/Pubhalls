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
async function getdata(){
    const response = await fetch("https://a.vibot.tech:3002/api/afkchecks")
    const data = await response.json()
  return data  
}
getdata()

window.onload = async (event) => {
    let activeAfk = [] ,activeRun = []
    let data = await getdata()
    for(let i in data){
        if (data[i].active) activeRun.push(data[i])
        else activeAfk.push(data[i])
    }

    function RenderAfk (afkCheck, active){
        let started
        if (afkCheck.started) started = Math.abs((Data.now() - afkCheck.started) / 1000)
        let rectang = document.createElement('div')
        if (active) return {

        }
    }
    console.log(data)
}

