// global variables
var LOCAL = true;	// directo access to SVM controller

//var LANG = 'en';
//var LOCALE = 'en-GB';
//var LANG = 'es';
//var LOCALE = 'es';
var LANG = 'br';
var LOCALE = 'pt-BR';
//var LANG = 'cn';
//var LOCALE = 'zh-CN';

//var MODEL='S1';
var MODEL='C1';
//var MODEL='C2';
//var MODEL='H1';
//var MODEL='S2';
//var MODEL='S3';
//var MODEL='R3';

var TP = false;	// SVMPC1t is true

var VERSION = 'V2.1.23';	// for C1,C2
//var VERSION = 'V1.0.11';	// for H1, S2
//var VERSION = 'V2.0.3';	// for S3
//var VERSION = 'V1.0.0'; // for S4
//var VERSION = 'V1.0.3'; // for R3

var PREPAIED = false;

var COMM_PORT = new CommModule();
var SCREEN_LIST = {};		// {"top":{"type":"default/standard/visual", "screen":[screen id list], "bgimg":filename, "layout":{screen id:[{"x":V, "y":V}],…}}, screen id:{"id":screen id, "type":"standard/visual", "name":name, "point":[point id list], "bgimg":filename, "layout":{point id:{"x":V, "y":V, "info":{…}},…}},…}
var POINT_LIST = {}; 		// {info:{id,name,icon,attr},stat:{status}}
var POINT_ID_LIST = [];
var STRING_TABLE = {};	// {lang:{key,str,...},lang:{key,str,...},...}
var HOSTNAME = location.hostname;
if(HOSTNAME == "") HOSTNAME = '127.0.0.1';
var USERLIST = [];
var ROOMLIST = [];
var ROOM_ID = {};
var ICONLIST = new Array();
var SCENEICONLIST = new Array();
var COMHASH = new Array();
var SNDTIMER = null;
var SPSTEP = 0.5;
var SELECTEDID;
var SELECTED_POINT;
var SP_INFO;
var SB_MIN = 10;
var SB_MAX = 35;
var USER;
var PASSWD;
var AUTOLOGIN = false;
var WIDTH = 0;	// window size
var HEIGHT = 0; // window size
var MH = 35;		// menue height
var SCROLLTOP = 0;
var COMM_CACHE = {};
var TENANT_LIST = {};  // {tenant_name:{id:[id,...],limit:val},...}
var	INTERLOCK_LIST = {'interlock':{'enable':'false','owner':'','name':'','timer1':0,'timer2':0,'input':{'id':'','detectCondition':{}},'output1':{'condition':'','controls':{'id':'','command':{}}},'output2':{'condition':'','controls':{'id':'','command':{}}}}};
var INTERLOCK_SEL = {};	
var INTERLOCK_PROG = {};
var HOTEL_LIST = {};
var ROOM_DETAILS = {};
var HOTEL_SENSORFCUPAIRING = {};
var HOTEL_TEMPSENSOR = {};
var SCENES_SEL = {};
var	SCENES_LIST = {"name":{"owner": "","name": "","output": [{"id": "","command": {}}]}};
var BROADLINK_LEARNED_COMMAND = [];
var BROADLINK_COMMANDS = {};
//Kaiwei 16/07/2018 Added Reports_Type_list
/******************************************/
var	REPORT_TYPE_LIST = {"reportTypes": [{"owner": "","name": "", "icon": ""}]};
var TEMPERATURE_DATA_FOR_GRAPH = [];
var DATAROW = [];
var DATAKEYS;
/******************************************/
//Kaiwei 15/08/2018 Added Categorized PI
/******************************************/
var CATEGORIZED_PI = {};
var PI_CATEGORIES = {};
/******************************************/
var FULL_HISTORY = [];  //array of history.db from server
var HISTORY = [];		//working array for display
var PAGECOUNT = 1;		//to manage current page count
var CURRENTPAGE = 1;	//current page number
var RECPP = 0;			//now used to store ID number of first record of history.db for pageNav purpose(records per page, to manage number of records to display in a page)
var DATESEL = new Date();	//date selected to display in HISTORY
var DATEFORMAT = 'yy/mm/dd';  // 'yy/mm/dd' or 'M d yy' or 'd/mm/yy' or 'yy M d'
var DATEOPT = {'year':'numeric','month':'short','day':'numeric'};
var BILL_DATA = {};	// {"name":name, "from":from,"to":to,"data":data, "result":result, "total":total,"price":prices, "total_power":total_power, "total_price": total price}
var BILL_INFO = {};	// {'owner':owner name,'address':[address1,2,3],'contact':[contact1,2,3],'currency':currency,'rate':[[enable/disable,from,to,rate,name],[…],[…],[…],[…]]}
var SPEC_CAL = [];	// special day array time_t*1000 is stored
var DEV_LIST = [];
var CLOCK = 'internet';	// clock adjustment method. internet or itm
var ADJUST_ITM = false;	// if true then iTM clock is adjusted by SVM controller
var TEMPUNIT = 'C';	// temp unit C or F

var DP = '.';
var SEP = ',';
var FS = ',';

var HOLIDAY = false;
var PPD = false;	// PPD billing enable or disable
var HOTEL = false;  // hotel guest room management
var DBMAN = false;	// Data Management display
var BEI = false;	// BEI rating display
var GID;
var SITE_ID;
var OP_LIMIT;

var BILL_DATA_COM = [];

// for connection setting
var USB_DEV = {};
var LAN_DEV = {};
var SMETER = null;
var USB_ID = 0;
var LAN_ID = 0;
var ZW_DEV = false;
var ZWAVE_DATA = ["ZWave",1,{"ip_addr":"127.0.0.1","port":8083,"user":"admin","passwd":"zadmin"}];
var METER_TYPE = {
	"ShPM5300":"Schneider PM5110/5300 series",
	"Lavato":"Lavato DMG210",
	"KRON":"KRON Multi-K series"
};
var DLG_TARG = {'dev':null,'did':null,'param':null};
var SMETER_TARG = null;
