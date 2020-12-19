var rawData = [];
var voltage = [];

for (var i = 0; i < 2; i++) {
  rawData[i] = document.getElementById("rawData" + i);
  voltage[i] = document.getElementById("voltage" + i);
}
console.log("init0:", rawData, voltage);

loadcell();
temp();

async function temp() {
  const gpioAccess = await navigator.requestGPIOAccess(); // GPIO を操作する
  const port1 = gpioAccess.ports.get(26); // 26 番ポートを操作する
  const temperatureDisplay = document.getElementById("temperatureDisplay");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const sht30 = new SHT30(port, 0x44);
  await sht30.init();
  await port1.export("out");

  while (true) {
    const { temperature } = await sht30.readData();
    temperatureDisplay.innerHTML = `${temperature.toFixed(2)} ℃`;
    var er = document.getElementById("error");
    if (temperature.toFixed(2) >= 32) {
      er.innerHTML = "体温が高いです。";
      await port1.write(1); // LED を点灯
      await sleep(100); // 1000 ms (1秒) 待機
    } else {
      er.innerHTML = "";
      await port1.write(0); // LED を消 灯
      await sleep(100); // 1000 ms (1秒) 待機
    }

    await sleep(0.5);
  }
}

async function loadcell() {
  // Initialize WebI2C
  var i2cAccess = await navigator.requestI2CAccess();
  try {
    var port = i2cAccess.ports.get(1);
    var ads1115 = new ADS1x15(port, 0x48);
    await ads1115.init(true, 7); // High Gain
    console.log("new");
    var firstTime = true;
    var tare;
    while (1) {
      try {
        var difA = await ads1115.read("0,1"); // p0-p1 differential mode
        rawData[0].innerHTML = "dif chA(0-1):" + difA.toString(16);
        voltage[0].innerHTML = ads1115.getVoltage(difA).toFixed(6) + "V";
        if (firstTime) {
          tare = difA;
          firstTime = false;
        }

        weight = difA - tare;
        rawData[1].innerHTML = "rawData - Tare:" + weight.toString(16);
        voltage[1].innerHTML = ads1115.getVoltage(weight).toFixed(6) + "V";
        /**
        var difB = await ads1115.read("2,3");
        rawData[1].innerHTML = "dif chB(2-3):" + difB.toString(16);
        voltage[1].innerHTML = ads1115.getVoltage(difB).toFixed(6) + "V";
      	**/
      } catch (error) {
        console.log(error);
      }
      await sleep(100);
    }
  } catch (error) {
    console.log("ADS1115.init error" + error);
  }
}

function fncGetHinmei(key) {
  if (key == "1") {
    Hinmei.value = "ラムネ";
    Kingak.value = 100;
  }
  if (key == "2") {
    Hinmei.value = "チョコレート";
    Kingak.value = 200;
  }
  Out.value = eval(Out.value) + eval(Kingak.value);
}

function add(i) {
  var node = document.createElement("div");
  node.innerHTML =
    '<input type="checkbox" id="check' +
    i +
    '" name="check" value="Kingak.value">';
  document.getElementById("container").appendChild(node);
  return node;
}

function remove() {
  var tab = document.getElementById("table");
  var boxes = document.getElementsByName("check");
  var cnt = boxes.length;
  //console.log(cnt);
  for (var j = 0; j < cnt; j++) {
    if (boxes.item(j).checked) {
      console.log("j;" + j);
      var cell = tab.rows[j + 1].cells[1].innerHTML;
      console.log(cell);
      Out.value -= eval(cell);
      tab.deleteRow(j + 1);
    }
  }
}

function qrParse(video) {
  const canvas = new OffscreenCanvas(240, 320);
  const render = canvas.getContext("2d");

  return new Promise((res) => {
    const loop = setInterval(() => {
      render.drawImage(video, 0, 0, canvas.width, canvas.height);

      const img = render.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(img.data, img.width, img.height);

      if (result) {
        clearInterval(loop);
        return res(result.data);
      }
    }, 100);
  });
}
