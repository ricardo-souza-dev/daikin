require 'mail'

# This object uses to send alert mail by using GMail SMTP server
class AlertMail
	def initialize(data_man = nil)
		@active = false
		@user = nil
		@passwd = nil
		@address = 'smtp.gmail.com'
		@domain = 'smtp.gmail.com'
		@port = 587
		@to = []
		@site = nil
		@lang = 'en'
		@th = nil
		@data_man = data_man
	end

	def set_server_info(server_info) 
		#server_info is 
		# {"active":true,
		#	"address":"smtp.gmail.com",
		# "domain":"smtp.gmail.com",
		#	"port":587,
		#	"user":"svm.daikin@gmail.com",
		#	"passwd":"daikin.svm",
		#	"to":["masayuki884@ezweb.ne.jp"],
		#	"site":"Demo Site",
		#	"lang":"en"}
		# this data is load from mail_server.json by DataManager
		return if(server_info == nil)
		@active = server_info['active'] if(server_info['active'] != nil)
		if(@active == "true" || @active == true)
			@active = true 
		else
			@active = false
		end
		@address = server_info['address'] if(server_info['address'] != nil)
		@port = server_info['port'] if(server_info['port'] != nil)
		@domain = server_info['domain'] if(server_info['domain'] != nil)
		@user = server_info['user'] if(server_info['user'] != nil)
		@passwd = server_info['passwd'] if(server_info['passwd'] != nil)
		@to = server_info['to'] if(server_info['to'] != nil)
		@site = server_info['site'] if(server_info['site'] != nil)
		@lang = server_info['lang'] if(server_info['lang'] != nil)
	end

	def get_mail_addr
		return @to
	end

	def set_mail_addr(addr) # addr is array of mail address
		@to = addr
	end

	def get_mail_server_info
		{
			'active'=>@active,
			'address'=>@address,
			'port'=>@port,
			'domain'=>@domain,
			'user'=>@user,
			'passwd'=>@passwd,
			'to'=>@to,
			'site'=>@site,
			'lang'=>@lang
		}
	end

	def lang
		@lang
	end

	def active?
		return @active
	end

	def send(subject,body) 
		return false if(@active == false)
		return false if(@user == nil)
		# subject: string
		# body: string
		@th = Thread.new do
			mail = Mail.new
			options = { 
				:address => @address,
			  :port => @port,
			  :domain => @domain,
			  :user_name => @user,
			  :password => @passwd,
			  :authentication => :plain,
			  :enable_starttls_auto => true  
			}        
			mail.charset = 'utf-8'
			mail.delivery_method(:smtp, options)
			mail.from(@user)
			mail.to(@to)    
			subject += "(#{@site})"
			mail.subject(subject)
			body = "#{@site}\n#{body}"
			mail.body(body)
			begin
				mail.deliver
				contents = ['alert_mail_sent']
				@data_man.add_history('System',contents) if(@data_man != nil)
			rescue => e
				contents = ['alert_mail_fail']
				@data_man.add_history('System',contents) if(@data_man != nil)
			end
		end
	end

	def wait
		@th.join
	end
end

#m = AlertMail.new
#m.setServerInfo 'smtp.gmail.com',587,'smtp.gmail.com','svm.daikin@gmail.com','daikin.svm'
#m.send(['masa884.ling@gmail.com','masayuki884@ezweb.ne.jp','masayuki.hayashi@daikin.co.jp'],'This is alert mail','Please check this e-mail')
#m.wait
