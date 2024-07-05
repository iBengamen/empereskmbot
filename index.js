const TelegramApi = require('node-telegram-bot-api');

const token ='5511146653:AAEQfrxGaJKFlvbsfupkw2BDBYNRpNr6Rz8'

const bot = new TelegramApi(token, {polling: true})

//npm install --save rss-parser
const Parser = require('rss-parser');
const parser = new Parser();
var feedBoss;
var feedSiege;
var feedTW;
var attention = Array();
var modeSendGroup = false;

var showMessage = false;
const chatGroup = '-1002162821222';
const chatGroupGareg = '-1002215788892';
const chatGroupEquipp = '-1002103477991';
const chatGroupPLKA = '-1001606164544';
const chatGroupMario1 = '-1001733456948';
const chatGroupMario2 = '-1001689595930';
const chatGroupMarader = '-1001346605280';
const chatGroupEllesar = '-1001546582023';
const chatGroupPiyPiy = '-1001903249049';

const papisdetiGroup = '-1002132804742';

var kmToday;

async function loadXMLBoss()
{
   feedBoss = await parser.parseURL('https://asterios.tm/index.php?cmd=rss&serv=0&filter=epic&count=100&out=xml');
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
    const timeToLoadRSS = '0:10';
    const timeToShowInfo = '6:0';
    

    const timeToShowReminder = '10:0';//'13:0';
    const timeToShowReminder2 = '150:0';//'10:0';//поставил 150 чтобы временно отключить напоминалку и оставить 1 раз в 14.00 по МСК
    
    
    //const chatGroup = '-1001629835772'; //ID группы ХНС
    //ID групы ХНС
    //const chatGroup = '-1001610386582';
    
    //проверяем непришло ли время показать оповещение о начале респа сегодня
    attention.forEach(element => {
        if (currentTime == element.attenTime)
        {
          element.attenTime = '';
          bot.sendMessage(chatGroup,element.txt,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupEquipp,element.txt,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupGareg,element.txt,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupPLKA,element.txt,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupMario1,element.txt,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupMario2,element.txt,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupMarader,element.txt,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupEllesar,element.txt,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupPiyPiy,element.txt,{parse_mode:'Markdown'});

        }
    });
    

    //перевіряємо чи неприйшов час показати повідомлення про респ РБ на 7 дней
    if(currentTime == timeToShowInfo)
    {
        if(!showMessage)
        {
          var fmsg = checkKMforFuture(7);
          bot.sendMessage(chatGroup,fmsg,{parse_mode:'Markdown'});
          
          bot.sendMessage(chatGroupEquipp,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupGareg,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupPLKA,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupMario1,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupMario2,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupMarader,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupEllesar,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupPiyPiy,fmsg,{parse_mode:'Markdown'});

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
          bot.sendMessage(papisdetiGroup,fmsg,{parse_mode:'Markdown'});

         
          bot.sendMessage(chatGroupEquipp,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupGareg,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupPLKA,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupMario1,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupMario2,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupMarader,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupEllesar,fmsg,{parse_mode:'Markdown'});

          bot.sendMessage(chatGroupPiyPiy,fmsg,{parse_mode:'Markdown'});

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
              bot.sendMessage(papisdetiGroup,fmsg,{parse_mode:'Markdown'});
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

function checkBossResp(findNameBoss, newResp, nameBoss, feedXML=feedBoss)
{
  var findBoss = false;
  var boss;
  

  for (var indx = 0; indx < feedXML.items.length; indx++) {  
      if (feedXML.items[indx].title == findNameBoss)
      {
          if (findBoss == false)
          {
            findBoss = true;

            var Dobj = feedXML.items[indx].pubDate;  
            var D = new Date(String(Dobj).slice(5,16));
                         
            //console.log(D);

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
  var txtToday = 'Нет КМов, отдыхайте друзья';

  attention = [];
  

  while (ind<arr.length-1) {
    if(ind+1 <= arr.length-1)
    {     
      var mirrordataYear1 = String(arr[ind].data)[6]+String(arr[ind].data)[7]+String(arr[ind].data)[8]+String(arr[ind].data)[9];
      var mirrordataMonth1 = String(arr[ind].data)[3]+String(arr[ind].data)[4];
      var mirrordataDay1 = String(arr[ind].data)[0]+String(arr[ind].data)[1];

      var mirrordataYear2 = String(arr[ind+1].data)[6]+String(arr[ind+1].data)[7]+String(arr[ind+1].data)[8]+String(arr[ind+1].data)[9];
      var mirrordataMonth2 = String(arr[ind+1].data)[3]+String(arr[ind+1].data)[4];
      var mirrordataDay2 = String(arr[ind+1].data)[0]+String(arr[ind+1].data)[1];

      var aData = new Date(mirrordataYear1,mirrordataMonth1-1,mirrordataDay1);
      var bData = new Date(mirrordataYear2,mirrordataMonth2-1,mirrordataDay2);

      //проверяем есть ли сегодня КМ
      //console.log('Сегодня = '+ today);
      //console.log('босс - ' + aData);

      if((today.getDate()) == aData.getDate())  
      {
        if((today.getMonth()) == aData.getMonth())
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
              arrToday.push(String(arr[ind].nBoss));
              var obj = new Object();
              obj.txt = new Object();
              obj.attenTime = new Object();
              if (arr[ind].nBoss == 'Осады, начало 18.00')
              {
                obj.txt = '*!!!Начинаем сбор на осаду!!!*';
                obj.attenTime = '14:30';
              }
              else
                if (arr[ind].nBoss == 'Битвы за земли, начало 20.00')
                {
                  obj.txt = '*!!!Начинаем сбор на ТВ!!!*';
                  obj.attenTime = '16:30';
                }
                else
                  {
                    obj.txt = '*!!!Ждем респ '+arr[ind].nBoss+ 'а!!!*'
                    obj.attenTime = '15:0';
                  }
              attention.push(obj); 
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

  console.log(attention);
  
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
      txt += ('*' + element.data +'* _'+ element.day +' '+ element.nBoss +'_\n');
    }
  });
  return txt;
}

function checkKMforFuture(days = 30)
{
  var arrKM = new Array();
/*для английских серверів*/
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

/*//для російських серверів
      arrKM.push(new Object(checkBossResp('Убит босс Beleth',5, 'Белеф')));
      arrKM.push(new Object(checkBossResp('Убит босс Beleth',10, 'Белеф')));
      arrKM.push(new Object(checkBossResp('Убит босс Beleth',15, 'Белеф')));
      arrKM.push(new Object(checkBossResp('Убит босс Beleth',20, 'Белеф')));
      arrKM.push(new Object(checkBossResp('Убит босс Beleth',25, 'Белеф')));
      arrKM.push(new Object(checkBossResp('Убит босс Beleth',30, 'Белеф')));

      arrKM.push(new Object(checkBossResp('Убит босс Baium',4, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Убит босс Baium',8, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Убит босс Baium',12, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Убит босс Baium',16, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Убит босс Baium',20, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Убит босс Baium',24, 'Баюм')));
      arrKM.push(new Object(checkBossResp('Убит босс Baium',28, 'Баюм')));

      arrKM.push(new Object(checkBossResp('Убит босс Antharas',8, 'Антарас')));
      arrKM.push(new Object(checkBossResp('Убит босс Antharas',16, 'Антарас')));
      arrKM.push(new Object(checkBossResp('Убит босс Antharas',24, 'Антарас')));

      arrKM.push(new Object(checkBossResp('Убит босс Valakas',8, 'Валакас')));
      arrKM.push(new Object(checkBossResp('Убит босс Valakas',16, 'Валакас')));
      arrKM.push(new Object(checkBossResp('Убит босс Valakas',24, 'Валакас')));

      arrKM.push(new Object(checkBossResp('Закончилась осада замка Rune',14, 'Осады, начало 18.00',feedSiege)));
      arrKM.push(new Object(checkBossResp('Закончились битвы за земли',14, 'Битвы за земли, начало 20.00',feedTW)));

      arrKM.push(new Object(checkBossResp('Закончилась осада замка Rune',28, 'Осады, начало 18.00',feedSiege)));
      arrKM.push(new Object(checkBossResp('Закончились битвы за земли',28, 'Битвы за земли, начало 20.00',feedTW)));
*/
      kmToday = sortArray(arrKM);


      
      
     
      var sndMsg = ''; 
      sndMsg += arrToStr(arrKM, days); 
      sndMsg += '\n \n'+'*Сегодня у нас:* \n'+ kmToday;

      return sndMsg;
}

bot.setMyCommands([
  {command: '/start', description: 'Начальное приветствие'},
  {command: '/sbor', description: 'Расписание КМ на 30 дней'},
  {command: '/joke', description: 'Травонуть анекдот'}
]);

bot.on('message', msg => {
    
    const text = msg.text;

    const chatId = msg.chat.id;

    const nameBot = '@AsteriosX5RBBot';

    const firstStart = '/start';
    const showAllKM = '/sbor';
    const addJoke = '/joke';
  

    console.log(chatId);
   //console.log(feedBoss);

   if((text == addJoke)||(text == addJoke+nameBot))
    {
      
      
      const arr = [
          '*Как ты чертила?* \nИз всех натуральных соков можешь позволить себе только желудочный?',
          '*Что скучно, да?* \nХаре дрочить, пора работать!!!',
          'Не умеешь работать мышкой - работай лопатой...',
          '*Вступайте в ряды Emperes клана!* \nТы такое сообщение хочешь от меня?',
          'Хуле приебались, дайте отдохнуть',
          'Человеческий мозг произошел от грецкого ореха.',
          'Куплю винчестер. Жесткие диски не предлагать.',
          '*Уфффффььь, заеееееббббалсяяяя.....*',
          'Каждый человек по-своему прав, а по-моему - нет.',
          'Press any key to continue or any other key to exit...',
          '*Хуле смотришь?* \nКофе на клавиатypy тоже виpyс пpолил?',
          'Когда в руках молоток, все вокруг кажется гвоздями.',
          'Дареному провайдеру в канал не смотрят.',
          'Склеpоз - пpекpасная болезнь! Hичего не болит и каждый день - новости...',
          'Хороший хирург поможет плохому танцору.',
          'Хyже всего на пpоизводительность влияют попытки ее yвеличить.',
          'Не будите спящего модератора!',
          'Когда мне понадобится узнать Ваше мнение, я Вам его скажу!',
          'Контролер: "У кого месячные, предъявляем!".',
          'Меняю комнатную собачку на двухкомнатную.',
          'Зеркало - это средство коммуникации с умным человеком.',
          'Если все вокруг заплевано и жизнь в дерьме, может, стоит протереть очки?',
          'Windows - как самолет: тошнит, а выйти некуда!',
          'У Татьяны такие умелые pуки... Она десять лет pаботала дояpкой!',
          'Hе все то пиво, что желтое и пенится...',
          'Чем шире угол зрения, тем он тупее...',
          'Kpacивo жить нe зaпpeтишь, нo пoмeшaть мoжнo!',
          'Продаю недорого монсерат кобылий.',
          'Хотя извилин не видно, но когда их нет, это очень заметно.',
          'Чем толще наши морды - тем теснее наши ряды.',
          'Придумают же люди... Актовый зал, половая тряпка....',
          'Даже самые красивые ножки растут из жопы',
          'Не украшайте забор своей писаниной! Писайте, пожалуйста, где-нибудь подальше!',
          'Однажды Карлсон надел штаны наизнанку. Так появилась мясорубка.',
          'Продается компьютерная мышь, пробег 1500 км.',
          'Отправь sms с текстом "Ты где?" на любой номер в 4 часа ночи и получи прикольную рифму на свой мобильник.',
          'Когда есть мозги - это хорошо! А когда их нет, то об этом не задумываешься.'
      ]; 

        var numPhrase = Math.floor(Math.random()*(arr.length-1));
        var msgg = arr[numPhrase];

      bot.sendMessage(chatId,msgg,{parse_mode:'Markdown'});
    }

    if((text == firstStart)||(text == firstStart+nameBot))
    {
      bot.sendMessage(chatId,'*Тебя приветствует чат бот, который отслеживает КМы для пачки Болгары ТМ Emperes клана.* \n Для получение информации о КМах используй комманду /sbor',{parse_mode:'Markdown'});
    }

    if((text == showAllKM)||(text == showAllKM+nameBot))
    {
      var fmsg = checkKMforFuture(30);
      bot.sendMessage(chatId,fmsg,{parse_mode:'Markdown'});
    } 

    if (modeSendGroup)
    {
      modeSendGroup = false;
      bot.sendMessage(chatId,'Сообщение успешно переслано в группу болгар',{parse_mode:'Markdown'});
      //bot.sendMessage(chatGroup,text,{parse_mode:'Markdown'});
      //bot.sendMessage(chatGroupEquipp,text,{parse_mode:'Markdown'});
      bot.sendMessage(papisdetiGroup,text,{parse_mode:'Markdown'});
      bot.sendMessage(chatId,text,{parse_mode:'Markdown'});
    }
 

    if(text == '/adminsend')
    {
      modeSendGroup = true;
      bot.sendMessage(chatId,'Режим отправки в группу включен следующий текст перешлет ваш текст в группу болгары',{parse_mode:'Markdown'});
    } 
    
})
//ентерфрейм
setInterval(onEnterFrame, 1000, 1);


/*PS E:\HTML5\telegram_bot> git remote add origin https://github.com/iBengamen/empereskmbot.git
fatal: remote origin already exists.
PS E:\HTML5\telegram_bot>  git push origin master*/
