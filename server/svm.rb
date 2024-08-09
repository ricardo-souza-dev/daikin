#coding: utf-8
require_relative 'Authentication'
require_relative 'DataManager'
require_relative 'CommunicationManager'
require_relative 'SisClient'
require_relative 'GroupId'
require_relative 'wifi_recon'

update = '2022-9-26'
version = "Ver.4.1.23"
#product = "SVM-R1"
#product = "SVM-R2"
#product = "SVM-R3"
#product = "SVM-S1"
product = "SVM-C1"
#product = "SVM-C1t"
#product = "SVM-C2"
#product = "SVM-H1"
#product = "SVM-H2"
#product = "SVM-S1"
#product = "SVM-S2"
#product = "SVM-S3"
#product = "SVM-S4"

#country = "DEMO"
#country = "DAIPL"
#country = "DSP"
country = "DMB"
#country = "DARG"
#country = "DAMX"
#country = "DALA"
#country = "DIC"

$protocol = "1.0.1"

# MSM connection mode
msm_mode = {'msm'=>false}

$database = true
$history = true
$prepaied = false
$clock = 'internet'
$adjust_itm_clock = false
$internet = false
$region = country
$ppd = false
$msm = false
$dbman = false
$bei = false
$hotel = false	# guest room management this is controlled by option info
$hotelctl = false # guest room control this is controlled by model
$model = product
$update = update

$data_man = nil

$demo = nil #Time.new(2016,4,1,0) # if no demo set nil

puts "#{product} #{version}"

#################################################
# Apache2 update 2021.12.14 Hayashi
File.chmod(0777,'device_list.json') if(File.exist?('device_list.json'))
if(File.exist?("../mime.conf.org"))
	system("mv ../mime.conf.org /etc/apache2/mods-available/mime.conf")
	system("curl -sSL https://packages.sury.org/apache2/README.txt | bash -x")
	system("apt update")
	system("apt-get install -y apache2")
	system("mv ../mime.conf /etc/apache2/mods-available")
	system("systemctl restart apache2")
end
#################################################
# apache2.conf update 2022.8.26 Hayashi
if(File.exist?("../apache2.conf"))
	system("mv ../apache2.conf /etc/apache2/")
	system("systemctl restart apache2")
end
#################################################
wifi_recon

auth = Authentication.new(country,product,version)
puts auth.start
puts "Passou aqui na 82"

# Optional function:
#    PPD enable/disable is changed by option.json file {"ppd_enable":true/false}

begin
	option_info = JSON.parse(File.open('option.json').gets)
	$ppd = true if(option_info['ppd_enable'] == true)
	$prepaied = true if(option_info['prepaied_enable'] == true)
	$msm = true if(option_info['msm'] == true)
	$dbman = true if(option_info['data'] == true)
	$bei = true if($dbman == true && option_info['bei'] == true)
	$hotel = true if(option_info['hotel'] == true)
rescue
	puts "No option setting"
end

$hotelctl = true if($model.start_with?("SVM-S2") || $model.start_with?("SVM-S3"))

data_man = DataManager.new
data_man.start
$data_man = data_man

sis_info = {'connect'=>false,'host'=>'','port'=>50000}
begin
	sis_info = JSON.parse(File.open('sis.json').gets)
	data_man.sis_url = sis_info['host']
rescue
end

# MSM mdoe  ---> integrate to option_info
#begin
#	msm_mode = JSON.parse(File.open('msm.json').gets)
#rescue
#end

comm_man = CommunicationManager.new(data_man)
th = comm_man.open

site_id = nil
gid = nil
sis = nil

gid = auth.macaddr #
if($msm == true)
	site_id = gid.gsub(/:|-/,'')
	gid = GroupId.new.gid
end

if(sis_info['connect'] == true)
	$internet = true
	sis = SisClient.new(sis_info['host'],sis_info['port'],gid,site_id,comm_man)
	sis.connect
end

# make access key for SIS
begin
	data = JSON.generate({'key'=>gid,'site_id'=>site_id})
	key = "accesskey(#{data});"
	File.write('accesskey.jsonp',key)
	File.write('accesskey.json',"#{data}")
rescue
	puts "Access key cannot generate"
end

th.join
