const TelegramApi = require('node-telegram-bot-api');

const token ='5511146653:AAEQfrxGaJKFlvbsfupkw2BDBYNRpNr6Rz8'

const bot = new TelegramApi(token, {polling: true})

//npm install --save rss-parser
const Parser = require('rss-parser');
const parser = new Parser();
var feed;
var feedSiege;
var feedTW;

var showMessage = false;

var kmToday;

async function loadXMLBoss()
{
   feed = await parser.parseURL('https://asterios.tm/index.php?cmd=rss&serv=0&filter=epic&count=100&out=xml');
}

async function loadXMLSiege()
{
  feedSiege = await parser.parseURL('https://asterios.tm/index.php?cmd=rss&serv=0&filter=siege&out=xml');
}

async function loadXMLTW()
{
  feedTW = await parser.parseURL('https://asterios.tm/index.php?cmd=rss&serv=0&filter=tw&out=xml');
}


loadXMLBoss();
loadXMLSiege();
loadXMLTW();

function onEnterFrame()
{
  var today = new Date();
 
    // получаем дату и время
    var Hh = today.getHours();//часовой пояс +3
    var Mm = today.getMinutes();

    var currentTime = Hh + ':' + Mm;
    //вкажемо час коли показувати повідомлення
    const timeToLoadRSS = '5:55';
    const timeToShowInfo = '6:0';
    const timeToShowReminder = '13:0';
    const timeToShowReminder2 = '10:0';
    
    const chatGroup = '-1001629835772';
    //перевіряємо чи неприйшов час показати повідомлення про респ РБ
    if(currentTime == timeToShowInfo)
    {
        if(!showMessage)
        {
          var fmsg = checkKMforFuture(7);
          bot.sendMessage(chatGroup,fmsg,{parse_mode:'Markdown'});
          showMessage = true;
        }
    }
    else if(currentTime == timeToShowReminder)
      {
        if(!showMessage)
        {
          if(kmToday == null)
          {
            checkKMforFuture(7);
          }

          var fmsg = '*Напоминаю, что сегодня у нас:* \n'+ kmToday;
          bot.sendMessage(chatGroup,fmsg,{parse_mode:'Markdown'});
          showMessage = true;
        }
      }
      else if(currentTime == timeToLoadRSS)
        {
          if(!showMessage)
          {
            loadXMLBoss();
            loadXMLSiege();
            loadXMLTW();  
            showMessage = true;
          }
        }
        else if(currentTime == timeToShowReminder2)
          {
            if(!showMessage)
            {
              if(kmToday == null)
              {
                checkKMforFuture(7);
              }
            
              var fmsg = '*Напоминаю, что сегодня у нас:* \n'+ kmToday;
              bot.sendMessage(chatGroup,fmsg,{parse_mode:'Markdown'});
              showMessage = true;
            }
          }
          else
          {
            showMessage = false;
          }
        
}

function NormalnumData(num)
{
  var normal = ''+ num;
  if(num<10)
  {
    normal = '0'+num;
  }
  return normal;
}

function NormalDay(num)
{
  var day = ['(вс)', '(пн)', '(вт)', '(ср)', '(чт)', '(пт)', '(сб)'];
  return day[num];
}

function checkBossResp(findNameBoss, newResp, nameBoss, feedXML=feed)
{
  var findBoss = false;
  var boss;
  
  for (var indx = 0; indx < feedXML.items.length; indx++) {  
      if (feedXML.items[indx].title == findNameBoss)
      {
          if (findBoss == false)
          {
            findBoss = true;
            var D = new Date(feedXML.items[indx].pubDate);
            var respDay = D.getDate() + newResp;
            D.setDate(respDay);

            boss = new Object();
            boss.data = new Object();
            boss.data =  NormalnumData(D.getDate())+'.'+NormalnumData(D.getMonth()+1)+'.'+D.getFullYear();  
            boss.day = new Object();
            boss.day = NormalDay(D.getDay()); 
            boss.nBoss = new Object();
            boss.nBoss = nameBoss;            
          }
      }
   }
   return boss;
}

function sortArray(arr)
{
  var ind = 0;
  var arrToday = new Array();
  var today = new Date();
  var txtToday = 'Сегодня нет КМов, отдыхаем товарищи';

  while (ind<arr.length-1) {
    if(ind+1 <= arr.length-1)
    {     
      var mirrordataYear1 = String(arr[ind].data)[6]+String(arr[ind].data)[7]+String(arr[ind].data)[8]+String(arr[ind].data)[9];
      var mirrordataMonth1 = String(arr[ind].data)[3]+String(arr[ind].data)[4];
      var mirrordataDay1 = String(arr[ind].data)[0]+String(arr[ind].data)[1];

      var mirrordataYear2 = String(arr[ind+1].data)[6]+String(arr[ind+1].data)[7]+String(arr[ind+1].data)[8]+String(arr[ind+1].data)[9];
      var mirrordataMonth2 = String(arr[ind+1].data)[3]+String(arr[ind+1].data)[4];
      var mirrordataDay2 = String(arr[ind+1].data)[0]+String(arr[ind+1].data)[1];

      var aData = new Date(mirrordataYear1,mirrordataMonth1,mirrordataDay1);
      var bData = new Date(mirrordataYear2,mirrordataMonth2,mirrordataDay2);

      //проверяем есть ли сегодня КМ
      if((today.getDate()) == aData.getDate())  
      {
        if((today.getMonth()+1) == aData.getMonth())
        {
          if (today.getFullYear()==aData.getFullYear())
          {
            //проверяем нет ли такого же елемента в нашем масиве
            var write = true;
            arrToday.forEach(element => {
              if(element == arr[ind].nBoss)
              {
                write = false;
              }
            });
            

            if(write == true)
            {
              arrToday.push(String(arr[ind].nBoss));;
            }
          }
        }
      }

      if(aData>bData)
      {
        var sortElement;
        sortElement = arr[ind];
        arr[ind] = arr[ind+1]
        arr[ind+1] = sortElement;
        ind = 0;
      }
      else
      {
        ind++;      
      }
    }
  }
  if(arrToday.length>0)
  {
    txtToday = '';
    arrToday.forEach(element => {
      txtToday+=element+' \n'
    });
  }
  return txtToday;
}

function arrToStr(arr, days=30)
{
  var txt = '*Расписание КМ на ближайшие '+days+' дней:* \n';
  arr.forEach(element => {
    //проверяем дату которую задали для показа сообщения
    var mirrordataYear1 = String(element.data)[6]+String(element.data)[7]+String(element.data)[8]+String(element.data)[9];
    var mirrordataMonth1 = String(element.data)[3]+String(element.data)[4];
    var mirrordataDay1 = String(element.data)[0]+String(element.data)[1];
    var aData = new Date(mirrordataYear1,mirrordataMonth1-1,mirrordataDay1);
    var dateToday = new Date();
    dateToday.setDate(dateToday.getDate()+days);
    if(aData<=dateToday)
    {
      txt += ('*' + element.data +'* _'+ element.day +' '+ element.nBoss +'_\n')
    }
  });
  return txt;
}

function checkKMforFuture(days = 30)
{
  var arrKM = new Array();

      arrKM.push(new Object(checkBossResp('Boss Beleth was killed',5, 'Белеф')));
      arrKM.push(new Object(checkBossResp('Boss Beleth was killed',10, 'Белеф')));
      arrKM.push(new Object(checkBossResp('Boss Beleth was killed',15, 'Белеф')));
      arrKM.push(new Object(checkBossResp('Boss Beleth was killed',20, 'Белеф')));
      arrKM.push(new Object(checkBossResp('Boss Beleth was killed',25, 'Белеф')));
      arrKM.push(new Object(checkBossResp('Boss Beleth was killed',30, 'Белеф')));

      arrKM.push(new Object(checkBossResp('Boss Baium was killed',4, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Boss Baium was killed',8, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Boss Baium was killed',12, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Boss Baium was killed',16, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Boss Baium was killed',20, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Boss Baium was killed',24, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Boss Baium was killed',28, 'Баюм')));

      arrKM.push(new Object(checkBossResp('Boss Antharas was killed',8, 'Антарас')));
      arrKM.push(new Object(checkBossResp('Boss Antharas was killed',16, 'Антарас')));
      arrKM.push(new Object(checkBossResp('Boss Antharas was killed',24, 'Антарас')));

      arrKM.push(new Object(checkBossResp('Boss Valakas was killed',8, 'Валакас')));
      arrKM.push(new Object(checkBossResp('Boss Valakas was killed',16, 'Валакас')));
      arrKM.push(new Object(checkBossResp('Boss Valakas was killed',24, 'Валакас')));

      arrKM.push(new Object(checkBossResp('The siege of Rune has ended',14, 'Осады, начало 18.00',feedSiege)));
      arrKM.push(new Object(checkBossResp('Territory wars has ended',14, 'Битвы за земли, начало 20.00',feedTW)));

      arrKM.push(new Object(checkBossResp('The siege of Rune has ended',28, 'Осады, начало 18.00',feedSiege)));
      arrKM.push(new Object(checkBossResp('Territory wars has ended',28, 'Битвы за земли, начало 20.00',feedTW)));

      kmToday = sortArray(arrKM);


      
      
     
      var sndMsg = ''; 
      sndMsg += arrToStr(arrKM, days); 
      sndMsg += '\n \n'+'*Сегодня у нас:* \n'+ kmToday;

      return sndMsg;
}

bot.setMyCommands([{
  command: '/start', description: 'Начальное приветствие',
  command: '/sbor', description: 'Расписание КМ на 30 дней',
}]);

bot.on('message', msg => {
    
    const text = msg.text;

    const chatId = msg.chat.id;

    const firstStart = '/start'
    const showAllKM = '/sbor'

    console.log(chatId);

    if(text == firstStart)
    {
      
    }

    if(text == showAllKM)
    {
      var fmsg = checkKMforFuture(30);
      bot.sendMessage(chatId,fmsg,{parse_mode:'Markdown'});
    }  
    
})
//ентерфрейм
setInterval(onEnterFrame, 1000, 1);


/*PS E:\HTML5\telegram_bot> git remote add origin https://github.com/iBengamen/empereskmbot.git
fatal: remote origin already exists.
PS E:\HTML5\telegram_bot> git push origin master*/