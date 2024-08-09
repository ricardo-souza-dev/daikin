require 'faraday'
require 'json'
require_relative 'Device'
require_relative 'DioZw'
require_relative 'AiZw'

# ZWave class method
#
# initialize
#   create object
#   return: no
# setup(:hostname=>'127.0.0.1',:port:=>8083,:username=>'admin',:password=>'zadmin')
#   setup ZWay connection information
#   return: no
# init
#   retrieve ZWave device information and make data inside in ZWave object
#   return: no
# update
#   update status information and return 
#   return: update information(COS array)
# execlude('start'/'stop')
#   start or stop exclude process
#   return: no
# include('start'/'stop')
#   start or stop include process
#   return: no

# get_all_status
#   return status information of all 

class ZWave < Device
	def initialize(id,data_man)
		super
		@port = 8083
		@ipaddr = '127.0.0.1'
		@user = 'admin'
		@passwd = 'zadmin'
		@poling_wait = 1
		@update_counter = 0

		@devices = {}	# devices[dev_id] = {instances[n]=>instance object,...}
		@update_time = 0
    @data_tree_base_path = '/ZWaveAPI/Data/'
    @run_base_path = '/ZWaveAPI/Run/'
    @base_uri = 'http://127.0.0.1:8083'
		@connection = nil

		@@device_db = []

		begin
			File.open('deviceInfo.json') do |file|
				@@device_db = JSON.load(file)
			end
		rescue => e
			@@device_db = []
		end
	end

	attr_reader :devices

	def key
		'zw'
	end

	def device_attr
		{'ip_addr'=>@ipaddr,'port'=>@port,'user'=>@user,'passwd'=>@passwd}
	end

	def set_attribute(attr)
		@ipaddr = attr['ip_addr'] if(attr['ip_addr'] != nil)
		@port = attr['port'] if(attr['port'] != nil)
		@user = attr['user'] if(attr['user'] != nil)
		@passwd = attr['passwd'] if(attr['passwd'] != nil)
	end

	def changed?(attr)
		return true if(@ipaddr != attr['ip_addr'])
		return true if(@port != attr['port'])
		return true if(@user != attr['user'])
		return true if(@passwd != attr['passwd'])
		return false
	end

	def connect
		Thread.new do
			setup(:hostname=>@ipaddr,:port=>@port,:username=>@user,:password=>@passwd)
			loop {
				begin
					# initialize
					puts "Try to connect to ZWave system"
					init
					puts "Connected"
					# get point list
					@point_list = make_point_list

					# register points
					@data_man.update_point_list(@point_list)
					stat = get_point_value
					@ready = true
					# send cos to dataman by value
					status = convert_to_std(stat)
					status.each do |id, cos| 
						check_value(id,cos)
						@data_man.cos(id,@dev_id,cos) 
					end

					check_initial_com_stat

					loop {
						# update status
						updated_status = update
						# send cos to dataman
						updated_status.each do |pid, cos|
							next if(pid == nil)
							check_value(pid,cos)
							@data_man.cos(pid,@dev_id,cos)
						end
						sleep(@poling_wait)
					}
				rescue => e
					dev_disconnected if(@ready == true)
					puts "Error: #{e}"
					@ready = false
					system('systemctl restart z-way-server')
					sleep(10)
					puts "Next connection"
				end
			}
		end
		send_command
	end

	def dev_disconnected
#		@data_man.add_history('System',['disconnected_zw',@ipaddr])

		@point_list.each_value do |point|
			@data_man.cos(point.pid,@dev_id,{'com_stat'=>false})
		end
	end

	def send_command
		Thread.new do
			loop {
				begin
					while(command = @com_queue.pop)
						puts "COMMAND: #{command}"
						pid = command[0]
						command[1].each do |key,val|
							operate_device(pid,key,val)
						end						
					end
				rescue
				end
			}
		end
	end

	# convert version if key is error
	def check_value(pid,cos)
#		puts "CHECK_VALUE #{pid} #{cos}"
		return if(pid == nil)
		if(@devices[pid/100].point_list[pid]['type'] == 'Dio' || @devices[pid/100].point_list[pid]['type'] == 'Shutter')
			cos['stat'] = cos.delete('level') if(cos['level'] != nil)
		end
#		puts "CHECK VAL: #{pid} #{cos}"
		cos.each do |key,val|
			case key
			when 'error'
				if(val == 'on')
					cos[key] = true
				else
					cos[key] = false
				end
			when 'av'
				cos[key] = val.to_f
			when 'level'
				cos[key] = val.to_f
			end
		end 
	end

	def setup(options = {})
    hostname = options[:hostname] || '127.0.0.1'
    port = options[:port] || 8083
    username = options[:username] || 'admin'
    password = options[:password] || 'zadmin'
    adapter_params = :httpclient
    @base_uri="http://#{hostname}:#{port}"
    @connection = Faraday.new do |connection|
      connection.basic_auth username, password
      connection.adapter *adapter_params
    end
	end

	def init
		@devices = {}	
		@update_time = 0
    results = get_zway_data_tree_updates
    if results.has_key?('devices')
      results['devices'].each do |device_id,device_data_tree|
      	device_id = device_id.to_i
      	next if(device_id == 1)
      	@devices[device_id] = ZDevice.new(device_id,device_data_tree)
      end
    end
	end

	def check_initial_com_stat
		updated = {}
    @devices.each do |id,dev|
    	dev.check_initial_com_stat

    	dev.check_com_stat.each do |pid,stat|
    		updated[pid] = {} if(updated[pid] == nil)
    		updated[pid].update(stat)
	    end
    end
	end

	def update
		@update_counter += 1
		if(@update_counter > 600)
			request_update(@connection,"#{@base_uri}#{@run_base_path}") 
			@update_counter = 0
		end
		updated = {}
    results = get_zway_data_tree_updates
#    results['devices'].each do |device_id,device_data_tree|
#    	device_id = device_id.to_i
#    	next if(device_id == 1)
#    	update = @devices[device_id].update(device_data_tree['instances'])
#    	update.each do |pid,cos|
#	    	updated[pid] = {} if(updated[pid] == nil)
#	    	updated[pid].update(cos) if(cos != nil)
#	    end
#    end

    results.each do |key,data|
    	keys = key.split('.')
    	next if(keys.length == 0 || keys.shift != 'devices')
    	dev_id = keys.shift.to_i
    	if(@devices[dev_id] != nil)
#    		puts "UPDATE KEY #{dev_id} #{keys}"
	    	pid,cos = @devices[dev_id].update(keys,data) 
	    	next if(pid == nil || pid == "")
	    	updated[pid] = {} if(updated[pid] == nil)
	    	updated[pid].update(cos) if(cos != nil)
	    end
   end
    # check communication status
    @devices.each do |id,dev|
    	dev.check_com_stat.each do |pid,stat|
    		updated[pid] = {} if(updated[pid] == nil)
    		updated[pid].update(stat)
	    end
    end

#    puts "UPDATE: #{updated}"
    return updated
	end

	# force update of zwave device status
	def request_update(connection,url)
		@devices.each do |id,dev|
			dev.request_update(connection,url)
		end
	end

	def make_point_list
		point_list = {}
		point = nil
		@devices.each do |id,dev|
#			puts "DEV #{id} #{dev.point_list.keys}"
			# subtype information: manufacturer,name,model
			subtype = dev.get_subtype
			dev.point_list.each do |pid,attr|
				puts "Make point: #{attr['type']} #{pid} #{attr['name']} #{attr}"
				point = nil
				case attr['type']
				when 'Shutter'
					puts "Shutter #{pid}"
					point = ShutterZw.new(pid,@dev_id)
				when 'Shutter2'
					puts "Shutter2 #{pid}"
					point = Shutter2Zw.new(pid,@dev_id)
				when 'SmartPi'
					puts "SmartPi"
					point = SmartPi.new(pid,@dev_id)
				when 'LevelSwitch'
					puts "LevelSwitch"
					point = LevelSwitch.new(pid,@dev_id)
				when 'RgbLevel'
					puts "RgbLevel"
					point = RgbLevel.new(pid,@dev_id)
				when 'Alarm'
					puts "Alarm #{pid}"
					point = AlarmZw.new(pid,@dev_id)
				when 'Ai'
					puts "Ai #{pid}"
					point = AiZw.new(pid,@dev_id)
				when 'Dio'
					puts "DIO #{pid}"
					point = DioZw.new(pid,@dev_id)
				when 'KeyLock'
					puts "KeyLock #{pid}"
					point = KeyLockZw.new(pid,@dev_id)
				when 'Di'
					point = DiZw.new(pid,@dev_id)
				when 'Scene'
				end
				if(point != nil)
					point_list[point.id] = point
				 	if(attr['name'] != nil)
						point.name = attr['name']
					else
						point.name = attr['type']
					end
					begin
						point.set_dev_attr(attr)
						puts "#{pid} #{point.name} #{attr['usage']}"
						point.sub_type = subtype
						point.usage = attr['usage']
					rescue
						puts "Interview is not completed"
						puts "Delete #{point.id} from list"
						point_list.delete(point.id)
					end
				end
			end
		end
		return point_list
	end

	def get_point_value
		point_value = {}
		@devices.each do |id,dev|
			point_value.update(dev.get_point_value)
		end
		return point_value
	end

	def operate_device(pid,element,value)
		dev_id = pid/100
		return false if(@devices[dev_id] == nil)
		point = @devices[dev_id].point_list[pid]
		return false if(point == nil)
		point['pointData'].each do |e,info|
			puts "****** #{pid} #{element} #{value} #{e}"
			if(e == element)
				instance = info['instance']
				command_class = info['commandClass']
				value = @devices[dev_id].instances[instance].command_classes[command_class].convert_command(value)
				command = "devices[#{dev_id}].instances[#{instance}].commandClasses[#{command_class}].Set(#{value})"
				puts "*** ZWAVE COMMAND: #{command}"
				send_com(command)
				return true
			end
		end
		return false
	end

  def exclude(flag)
  	val = 0
  	val = 1 if(flag == 'start')
  	command_path = "controller.RemoveNodeFromNetwork(#{val})"
  	network_command(command_path)
  end

  def include(flag)
  	val = 0
  	val = 1 if(flag == 'start')
  	command_path = 'controller.data.secureInclusion=true'
  	network_command(command_path)
  	command_path = "controller.AddNodeToNetwork(#{val})"
  	network_command(command_path)
  end

  def include_exclude_status
  	stat = {}
    results = get_zway_data_tree_updates
    results.each do |key,data|
    	keys = key.split('.')
    	next if(keys.length == 0 || keys.shift != 'controller')
    	next if(keys.length == 0 || keys.shift != 'data')
    	command = keys.shift
    	stat['execludeDev'] = data['value'] if(command == 'lastExecludedDevice')
    	stat['includeDev'] = data['value'] if(command == 'lastIncludedDevice')
    	stat['stat'] = data['value'] if(command == 'controllerState')
    end
    return stat
  end

  def get_zway_data_tree_updates
  	return false if(@connection == nil)
    results = {}
    url = @base_uri + @data_tree_base_path + "#{@update_time}"
    begin
      response = @connection.get(url)
      if response.success?
        results = JSON.parse response.body
        @update_time = results.delete('updateTime')
      else
      	# error
      	puts "Connection error"
      end
    rescue StandardError => e
    	# error
    	puts "ERROR: #{e}"
    end
    results
  end

  def network_command(command_path)
    begin
      uri = URI.encode(@base_uri + '/ZWave.zway/Run/' + command_path, '[]')
      response = @connection.post(uri)
      unless response.success?
        puts "Error: #{response.status}"
        puts "#{response.body}"
        return false
      end
    rescue StandardError => e
      puts "Failed to communicate with ZWay HTTP server: #{e}"
      return false
    end
    return true
  end

  def send_com(command_path)
    begin
      uri = URI.encode(@base_uri + @run_base_path + command_path, '[]')
      response = @connection.get(uri)
      unless response.success?
        puts "Error: #{response.status}"
        puts "#{response.body}"
        return false
      end
    rescue StandardError => e
      puts "Failed to communicate with ZWay HTTP server: #{e}"
      return false
    end
    return true
  end

  def convert_to_std(stat)
		status = {}	# {id=>{status}}
		stat.each do |pid,point|
#			puts "STAT: #{pid} #{@devices[pid/100].point_list[pid]['type']} #{point}"
			# dev_id can get pid/100
			case @devices[pid/100].point_list[pid]['type']
			when 'Di'
				status[pid] = conv_di(point['pointData'])
			when 'Dio'
				status[pid] = conv_di(point['pointData'])
			when "Ai"
				status[pid] = conv_ai(point['pointData'])
			when "LevelSwitch"
				status[pid] = conv_levelsw(point['pointData'])
			when "RgbLevel"
				status[pid] = conv_rgblevel(point['pointData'])
			when "Alarm"
				status[pid] = conv_alarm(point['pointData'])
			when 'KeyLock'
				status[pid] = conv_keylock(point['pointData'])
			when 'Shutter'
				status[pid] = conv_shutter(point['pointData'])
			when 'SmartPi'
				status[pid] = conv_spi(point['pointData'])
			end
		end  	
		return status
  end

	def conv_di(data)
		stat = {'maintenance'=> false,'com_stat'=>true}
		stat['stat'] = data['stat'] if(data['stat'] != nil)
		stat['error'] = data['error'] if(data['error'] != nil)
		stat['battery'] = data['battery'] if(data['battery'] != nil)
		return stat
	end

	def conv_ai(data)
		stat = {'maintenance'=>false,'com_stat'=>true}
		stat['av'] = data['av'].to_f
		stat['battery'] = data['battery'] if(data['battery'] != nil)
		return stat
	end

	def conv_levelsw(data)
		stat = {'maintenance'=>false,'com_stat'=>true}
		stat['level'] = data['av'].to_f
		stat['battery'] = data['battery'] if(data['battery'] != nil)
		return stat
	end

	def conv_rgblevel(data)
		stat = {'maintenance'=>false,'com_stat'=>true}
		stat['level'] = data['av'].to_f
		stat['r'] = data['r'].to_f
		stat['g'] = data['g'].to_f
		stat['b'] = data['b'].to_f
		stat['w'] = data['w'].to_f
		stat['battery'] = data['battery'] if(data['battery'] != nil)
		return stat
	end

	def conv_alarm(data)
		stat = {'maintenance'=>false,'com_stat'=>true}
		stat['error'] = data['stat']
		stat['battery'] = data['battery'] if(data['battery'] != nil)
		return stat
	end

	def conv_keylock(data)
		stat = {'maintenance'=> false,'com_stat'=>true}
		stat['stat'] = data['stat'] if(data['stat'] != nil)
		stat['error'] = data['error'] if(data['error'] != nil)
		stat['battery'] = data['battery'] if(data['battery'] != nil)
		return stat
	end

	def conv_shutter(data)
		stat = {'maintenance'=> false,'com_stat'=>true}
		stat['updown'] = data['updown'] if(data['updown'] != nil)
		return stat
	end

	def conv_spi(data)
		stat = {'maintenance'=>false,'com_stat'=>true}
		stat['meter'] = data['meter'] if(data['meter'] != nil)
		stat['power'] = data['power'] if(data['power'] != nil)
		return stat
	end

  def self.zwave_device_db
  	@@device_db
  end

end

# device manage how many management points are included
class ZDevice
	def initialize(dev_id, device_data_tree)
		@id = dev_id 	#device id
		@pid = 0

		@com_stat = {}

		@manufacturer = device_data_tree['data']['vendorString']['value']						#string
		@device_type = device_data_tree['data']['deviceTypeString']['value']					#string
		@manufacturer_id = device_data_tree['data']['manufacturerId']['value']				#number
		@product_type = device_data_tree['data']['manufacturerProductType']['value']	#number
		@product_id = device_data_tree['data']['manufacturerProductId']['value']	#number
		@product_name = "" #string get by manufacturer id and product type
		@model = ""  #string get by manufacturer id and product type
		@point_list = {}	# {pid=>{point data}}
		@device_info = find_product
		if(@device_info != nil)
			@model = @device_info["model"]
			@product_name = @device_info["name"]
		end
		@instances = create_instances(device_data_tree['instances'])
		# point_list is array of point data [{"type":"SmartPi","instance":0,"pointData":{"meter":{"commandClass":50,"data":0}}},...]
	  set_point_attribute
	end

	attr_reader :id, :instances, :point_list

	def generate_pid
		@pid += 1
		return @id*100+@pid
	end

	def get_subtype
		{'manufacturer'=>@manufacturer,'type'=>@device_type,'model'=>@model}
	end

	def request_update(connection,url)
		@instances.each do |id,instance|
			instance.request_update(connection,url)
		end
	end

	def check_initial_com_stat
		@instances.each do |id,instance|
			instance.check_initial_com_stat
		end
	end

	def check_com_stat
		@instances.each do |id,instance|
			if(instance.check_com_stat == true)
				return set_com_stat(true)
			end
		end
		# com status false
		return set_com_stat(false)
	end

	def set_com_stat(flag)
		cos = {}
		@point_list.each_key do |pid|
			cos[pid] = {'com_stat'=>flag}
		end
		return cos
	end

  def create_instances(device_data_tree)
  	instances = {}
  	device_data_tree.each do |n, instance_data_tree|
  		n = n.to_i
  		instances[n] = Instance.new(self,n,instance_data_tree['commandClasses'])
	  	if(@device_info == nil)	# all instances read and generate @point_list data
	  		@point_list.update(instances[n].get_point_list)
		  end
  	end
  	if(@device_info != nil)
	  	# deep copy from device info
	  	point_list = Marshal.load(Marshal.dump(@device_info['managementPoint']))
	  	point_list.each do |point|
	  		point['device'] = @id  # setup device id to this point
	  		pid = generate_pid
	  		@point_list[pid] = point
	  		# set id link
	  		point['pointData'].each do |val,data|
		  		instance = data['instance']
	  			commandClass = data['commandClass']
	  			begin
	  				instances[instance].command_classes[commandClass].alt = val if(point['type'] == 'RgbLevel' && val != 'av')	
		  			instances[instance].command_classes[commandClass].set_id_link(data['data'],pid)
		  		rescue
		  		end
	  		end
	  	end
	  end
  	return instances
  end

  # point information is filled by device data tree
  def set_point_attribute
  	@point_list.each do |pid,point|
  		point['manufacturer'] = @manufacturer
  		point['deviceType'] = @device_type
  		point['model'] = @model
  		point['name'] = @product_name
  		point['pointData'].each do |val,data|
	  		instance = data['instance']
  			commandClass = data['commandClass']
  			begin
	  			@instances[instance].command_classes[commandClass].set_attribute(data)
	  		rescue
	  		end
  		end
  	end
  end

  def get_point_value
  	value = {} 	# {pid=>{'device'=>id,'pid'=>,'piontData'=>{key=>value}},...}
  	@point_list.each do |pid,point|
 			pdata = {'device'=>@id,'pid'=>pid,'pointData'=>{}}
  		point['pointData'].each do |key,val|
  			begin
	  			pdata['pointData'][key] = @instances[val['instance']].command_classes[val['commandClass']].get_value(val['data'])
	  		rescue
	  			pdata['pointData'][key] = nil
	  		end
  		end
  		value[pid] = pdata
  	end
  	return value
  end

  # if product is registered in db then return product info, otherwise reruen nil
  def find_product
  	db = ZWave::zwave_device_db
  	db.each do |dev|
  		# add product id check for Aeotec products
  		if(dev["manufacturerId"] == @manufacturer_id && dev["productType"] == @product_type)
  			next if(@manufacturer_id == 134 && dev["productId"] != @product_id)
  			next if(@manufacturer_id == 316 && dev["productId"] != @product_id)
	  		return dev 
	  	end
  	end
  	return nil
  end

#  def update(device_data_tree)
#  	updated = {}
#  	@instances.each do |id, instance|
#  		id = id.to_s
#  		update = instance.update(device_data_tree[id]['commandClasses'])
#  		updated.update(update) # update is {pid=>{cos}}
#  	end
#  	return updated
#  end
#end
  def update(key,data)
  	return nil if(key.shift != 'instances')
  	# instnace
  	num = key.shift.to_i	#instance number
  	return "",nil if(@instances[num] == nil)
  	return @instances[num].update(key,data) 
  end
end

# management point data structure
#
# {pid=>{'type'=>pointType,'device'=>dev_id,'instance'=>instance_id,'pointData'=>{dataLabel=>{'commandClass'=>num,'data'=>dataTitle},...}},...}
#
# pointType
#  LevelSwitch
#  Ai
#  SmartPi
#  Dio
#  Di
#  Alarm
#  Scene
#  
# dataLabel
#   level <== LevelSwitch
#   av <== Analog Value
#   power <== Electricity[W]
#   meter <== Meter Value
#   value <== Multistate Value
#   stat <== on/off

class Instance
	def initialize(device, instance_id, instance_data_tree)
		@device = device
		@id = instance_id
		@command_classes = create_command_classes(instance_data_tree)
	end

	attr_reader :id, :command_classes, :device

#	def update(data_tree)
#		updated = {}
#		@command_classes.each do |id,command|
#			id = id.to_s
#			update = command.update(data_tree[id]['data'])
#			updated.update(update) if(update != nil)
#		end
#		return updated
#	end

	def update(key,data)
		return nil if(key.shift != 'commandClasses')
		num = key.shift.to_i	# commandClass
		return "",nil if(@command_classes[num] == nil)
		return @command_classes[num].update(key,data)
	end

	def check_initial_com_stat
		@command_classes.each do |id,command|
			begin
				command.check_initial_com_stat
			rescue => e
			end
		end
	end

	def check_com_stat
		@command_classes.each do |id,command|
			return true if(command.com_stat == true)
		end
		return false
	end

	def get_point_list
		point_list = {}
		@command_classes.each do |num, command|
			point_list.update(command.get_point_list)
		end
		return point_list
	end

	def request_update(connection,url)
		@command_classes.each do |id,command|
			command.request_update(connection,url)
		end
	end

  def create_command_classes(instance_data_tree)
  	command_classes = {}
  	instance_data_tree.each do |num, command_data_tree|
  		num = num.to_i
  		if(num == 37)
	  		command_classes[num] = SwitchBinary.new(self,command_data_tree)
	  	elsif(num == 38)
	  		command_classes[num] = SwitchMultiLevel.new(self,command_data_tree)
	  	elsif(num == 156)
	  		command_classes[num] = AlarmSensor.new(self,command_data_tree)
	  	elsif(num == 49) 
	  		command_classes[num] = SensorMultilevel.new(self,command_data_tree)
	  	elsif(num == 113)
	  		command_classes[num] = Alarm.new(self,command_data_tree)
	  	elsif(num == 98)
	  		command_classes[num] = DoorLock.new(self,command_data_tree)
	  	elsif(num == 50)
	  		command_classes[num] = Meter.new(self,command_data_tree)
	  	elsif(num == 128)
	  		command_classes[num] = Battery.new(self,command_data_tree)	  		
	  	elsif(num == 91)
	  		command_classes[num] = CentralScene.new(self,command_data_tree)
	  	elsif(num == 48)
	  		command_classes[num] = SensorBinary.new(self,command_data_tree)
	  	else
	  	end
  	end
  	return command_classes
  end
end

class CommandClass
	def initialize(instance,command_data_tree)
		@instance = instance
		@commandClass
		@name = command_data_tree['name']
		@data = command_data_tree['data']
		@alt = nil
		@id_link = {}	# store type=>pid to get pid from the type in command class
		@last_update = {} # pid=>{'time':time,'counter':counter,'com_stat':com_stat}
		@max = 5
	end

	attr_reader :name, :data, :id_link
	attr_accessor :alt

	def find_var_from_data(data)
		pid = @id_link[data]
		point = @instance.device.point_list[pid]
		return nil if(point == nil)
		point['pointData'].each do |key,element|
			return key if(element['data'].to_s == data)
		end
		return nil
	end

	def get_point_list
		return {}
	end

	def set_id_link(key,pid)
		key = key.to_s
		@id_link[key] = pid
	end

	def request_update(connection,url)
		dev_id = @instance.device.id
		instance = @instance.id
		path = "#{url}devices[#{dev_id}].instances[#{instance}].commandClasses[#{@commandClass}].Get()"
#		puts "URL: #{path}"
		url = URI.encode(path,'[]')
		ret = connection.post(url)
#		puts "RET: #{ret.success?}"
	end

	def com_stat
		@last_update.each do |id, stat|
			return true if(stat['com_stat'] == true)
		end
		return false
	end

	def check_initial_com_stat
		@id_link.each do |key,id|
			com_stat = false
			com_stat = true if(@data[key] != nil && @data[key]['updateTime'] > @data[key]['invalidateTime'])
			@last_update[id] = {'com_stat'=>com_stat,'time'=>@data[key]['invalidateTime'],'counter'=>0}
		end
	end

	def check_com_stat(id,time,invalidateTime)
		return if(id == nil)
		begin
#			puts "COMPARE: #{id} #{time} #{time-@last_update[id]['time']}"
			if(@last_update[id]['time'] < time)
				@last_update[id]['time'] = invalidateTime
				@last_update[id]['counter'] = 0
				@last_update[id]['com_stat'] = true # if(@last_update[id]['com_stat'] == false)
#				puts "CHECK COM UPDATED: #{@instance.device.id} #{@instance.id} #{@commandClass} #{id}: #{@last_update[id]}"
			elsif(@last_update[id]['com_stat'] == true)
				# communication error
				@last_update[id]['counter'] += 1
				if(@last_update[id]['counter'] == @max)
					@last_update[id]['com_stat'] = false
				end
			end
		rescue
			@last_update[id] = {'com_stat'=>true,'time'=>invalidateTime,'counter'=>0}
#			puts "CHECK COM NEW: #{@instance.device.id} #{@instance.id} #{@commandClass} #{id}: #{@last_update[id]}"
		end
	end

#	def update(data)
#		return {}
#	end
	def update(key,data)
		return "",nil
	end

	def get_value(data)
		return nil
	end

	def is_int?(val)
		return true if(val.class == Integer)
		val.to_i.to_s == val
	end

	def set_attribute(data)
	end

	def convert_command(value)
		return value
	end
end

class SwitchMultiLevel < CommandClass #38
	def initialize(instance,command_data_tree)
		super
		@commandClass = 38
	end

	def get_point_list
		pid = @instance.device.generate_pid
		@id_link["level"] = pid
		return {pid=>{"type"=>"LevelSwitch","device"=>@instance.device.id,"pointData"=>{"level"=>{"instance"=>@instance.id,"commandClass"=>38,"data"=>"level"}}}}
	end

	def check_initial_com_stat
		@id_link.each do |key,id|
			com_stat = false
			com_stat = true if(@data[key] != nil && @data[key]['updateTime'] > @data[key]['invalidateTime'])
			@last_update[id] = {'com_stat'=>com_stat,'time'=>@data[key]['invalidateTime'],'counter'=>0}
		end
	end

#	def update(data)
#		pid = @id_link['level']
#		check_com_stat(pid,data['level']['updateTime'])
#		if(@data['level']['value'] != data['level']['value'])	# data is changed
#			@data['level'] = data['level']
#			val = data['level']['value'].to_f
#			val = 100.0 if(val == 99)
#			cos = {pid=>{"level"=>val}}
#			cos = {pid=>{@alt=>val}} if(@alt)
#		end
#		return cos
#	end
	def update(key,data)
		return nil if(key.shift != 'data')
		element = key.shift
		return nil if(element != 'level')
		cos = nil
		begin 
			################################################
			check_com_stat(@id_link['level'],data['updateTime'],data['invalidateTime'])
			################################################
			# data is updated
			@data['level'] = data
			val = data['value'].to_f
			val = 100.0 if(val == 99)
			cos = {"level"=>val}
			cos = {@alt=>val} if(@alt)
		rescue
			cos = {}
		end
		return @id_link['level'],cos
	end

	def set_attribute(data)
		data['attr'] = {'min'=>0,'max'=>100}
	end

	def get_value(data)
		val = @data['level']['value']
		val = 100.0 if(val == 99)
		return val
	end

	def convert_command(value)
		value = 0 if(value == 'off')
		value = 99 if(value == 'on')
		value = 99 if(value >  99)
		return value
	end	
end

class SwitchBinary < CommandClass # 37
	def initialize(instance,command_data_tree)
		super
		@commandClass = 37
	end

	def get_point_list
		pid = @instance.device.generate_pid
		@id_link['level'] = pid
		return {pid=>{"type"=>"Dio","device"=>@instance.device.id,"pointData"=>{"stat"=>{"instance"=>@instance.id,"commandClass"=>37,"data"=>"level"}}}}
	end

	def check_initial_com_stat
		@id_link.each do |key,id|
			com_stat = true  	# always true
			@last_update[id] = {'com_stat'=>com_stat,'time'=>0,'counter'=>0}
		end
	end

#	def update(data)
#		pid = @id_link['level']
#		check_com_stat(pid,data['level']['updateTime'])
#		if(@data['level']['value'] != data['level']['value'])	# data is changed
#			@data['level'] = data['level']
#			val = 'off'
#			val = 'on' if(data['value'] == true)
#			cos = {pid=>{"level"=>val}}
#		end
#		return cos
#	end
	def update(key,data)
		return nil if(key.shift != 'data')
		element = key.shift
		return nil if(element != 'level')
		cos = nil
		begin
			################################################
	#		check_com_stat(@id_link['level'],data['updateTime'],data['invalidateTime'])
			################################################
			if(@data['level']['value'] != data['value'])
				# data is updated
				@data['level'] = data
				val = 'off'
				val = 'on' if(data['value'] == true)
				cos = {"level"=>val}
			end
		rescue
			cos = {}
		end
		return @id_link['level'],cos
	end

	def get_value(data)
		val = 'off'
		val = 'on' if(@data['level']['value'] == true)
		return val
	end

	def convert_command(value)
		value = false if(value == 'off')
		value = true if(value == 'on')
		return value
	end
end

class AlarmSensor < CommandClass # 156
	def initialize(instance,command_data_tree)
		super
		@commandClass = 156
	end

	def get_point_list
		point_list = {}
		@data.each_key do |key|
			next if(is_int?(key) == false)
			pid = @instance.device.generate_pid
			point_list[pid] = {"type"=>"Alarm","device"=>@instance.device.id,"pointData"=>{"stat"=>{"instance"=>@instance.id,"commandClass"=>156,"data"=>key}}}
			@id_link[key] = pid
		end
		return point_list
	end

	def check_initial_com_stat
		@id_link.each do |key,id|
			com_stat = false
			com_stat = true if(@data[key] != nil && @data[key]['sensorState']['updateTime'] > @data[key]['sensorState']['invalidateTime'])
			@last_update[id] = {'com_stat'=>com_stat,'time'=>@data[key]['sensorState']['invalidateTime'],'counter'=>0}
		end
	end

#	def update(data)
#		cos = {}
#		@data.each do |element,block|
#			pid = @id_link[element]
#			begin
#				check_com_stat(pid,data[element]['sensorState']['updateTime'])
#				if(block['sensorState']['value'] != data[element]['sensorState']['value'])	# data is changed
#					block['sensorState'] = data[element]['sensorState']
#					val = 'off'
#					val = 'on' if(data[element]['sensorState']['value'] > 0)
#					cos.update({pid=>{"stat"=>val}})
#				end
#			rescue
#			end
#		end
#		return cos
#	end
	def update(key,data)
		return nil if(key.shift != 'data')
		element = key.shift
		return nil if(is_int?(element) == false)
		cos = nil
		begin
			################################################
			check_com_stat(@id_link[element],data['sensorState']['updateTime'],data['sensorState']['invalidateTime'])
			################################################
			if(@data[element]['sensorState']['value'] != data['sensorState']['value'])
				# data is updated
				@data[element]['sensorState'] = data['sensorState']
				val = 'off'
				val = 'on' if(data['sensorState']['value'] > 0)
				cos = {"stat"=>val}
			end
		rescue
			cos = {}
		end
		return @id_link[element],cos
	end

	def set_attribute(data)
		data['attr'] = {'alarmType'=>@data[data['data'].to_s]['typeString']['value']}
	end

	def get_value(data)
		data = data.to_s
		val = 'off'
		val = 'on' if(@data[data]['sensorState']['value'] > 0)
		return val
	end
end

class SensorMultilevel < CommandClass 	# 49
	def initialize(instance,command_data_tree)
		super
		@commandClass = 49
	end

	def get_point_list
		point_list = {}
		@data.each_key do |key|
			next if(is_int?(key) == false)
			pid = @instance.device.generate_pid
			point_list[pid] = {"type"=>"Ai","device"=>@instance.device.id,"pointData"=>{"av"=>{"instance"=>@instance.id,"commandClass"=>49,"data"=>key}}}
			@id_link[key] = pid
		end
		return point_list
	end

	def check_initial_com_stat
		@id_link.each do |key,id|
			com_stat = false
			com_stat = true if(@data[key] != nil && @data[key]['val']['updateTime'] > @data[key]['val']['invalidateTime'])
			@last_update[id] = {'com_stat'=>com_stat,'time'=>@data[key]['val']['invalidateTime'],'counter'=>0}
		end
	end

#	def update(data)
#		cos = {}
#		@data.each do |element,block|
#			pid = @id_link[element]
#			next if(pid == nil)
#			begin
#				check_com_stat(pid,data[element]['val']['updateTime'])
#				if(block['val']['value'] != data[element]['val']['value'])	# data is changed
#					block['val'] = data[element]['val']
#					cos.update({pid=>{"stat"=>data[element]['val']['value']}})
#				end
#			rescue
#			end
#		end
#		return cos
#	end
	def update(key,data)
		return nil if(key.shift != 'data')
		element = key.shift
		return nil if(is_int?(element) == false)
		cos = nil
		begin
			################################################
			check_com_stat(@id_link[element],data['val']['updateTime'],data['val']['invalidateTime'])
			################################################
			data['val']['value'] = data['val']['value'].to_f
			if(@data[element]['val']['value'] != data['val']['value'])
				# data is updated
				@data[element]['val'] = data['val']
				cos = {"av"=>data['val']['value']}
			end
		rescue
			cos = {}
		end
		return @id_link[element],cos
	end

	def set_attribute(data)
		return if(@data[data['data'].to_s] == nil)
		data['attr'] = {'unit'=>@data[data['data'].to_s]['scaleString']['value'],'sensorType'=>@data[data['data'].to_s]['sensorTypeString']['value']}
	end

	def get_value(data)
		data = data.to_s
		return @data[data]['val']['value']
	end
end

class Alarm < CommandClass # 113
	def initialize(instance,command_data_tree)
		super
		@commandClass = 113
	end

	def get_point_list
		point_list = {}
		@data.each_key do |key|
			next if(is_int?(key) == false)
			pid = @instance.device.generate_pid
			point_list[pid] = {"type"=>"Di","device"=>@instance.device.id,"pointData"=>{"stat"=>{"instance"=>@instance.id,"commandClass"=>113,"data"=>key}}}
			@id_link[key] = pid
		end
		if(point_list.empty?)
			pid = @instance.device.generate_pid
			point_list[pid] = {"type"=>"Di","device"=>@instance.device.id,"instance"=>@instance.id,"pointData"=>{"stat"=>{"commandClass"=>113,"data"=>"V1event"}}}
			@id_link['V1event'] = pid
		end
		return point_list
	end

	def check_initial_com_stat
		@id_link.each do |key,id|
			if(key == 'V1event')
				com_stat = false
				com_stat = true if(@data[key] != nil && @data[key]['alarmType']['updateTime'] > @data[key]['alarmType']['invalidateTime'])
				@last_update[id] = {'com_stat'=>com_stat,'time'=>@data[key]['alarmType']['invalidateTime'],'counter'=>0}
			else
				com_stat = false
				com_stat = true if(@data[key] != nil && @data[key]['event']['updateTime'] > @data[key]['event']['invalidateTime'])
				@last_update[id] = {'com_stat'=>com_stat,'time'=>@data[key]['event']['invalidateTime'],'counter'=>0}
			end				
		end
	end

#	def update(data)
#		cos = {}
#		@data.each do |element,block|
#			pid = @id_link[element]
#			next if(pid == nil)
#			begin
#				if(is_int?(element) == true)
#					check_com_stat(pid,data[element]['event']['updateTime'])
#					if(block['event']['value'] != data[element]['event']['value'])	# data is changed
#						block['event'] = data[element]['event']
#						var = find_var_from_data(element)
#						val = 'on' if(data[element]['event']['value'] == 3 || data[element]['event']['value'] == 22 )
#						val = 'off' if(data[element]['event']['value'] == 0 || data[element]['event']['value'] == 23)
#						if(element == "7" && var == "stat")
#							val = 'on' if(data[element]['event']['value'] == 8)
#							val = 'off' if(data[element]['event']['value'] == 0)
	#						val = 'err' if(data[element]['event']['value'] == 3)
#						end
#						cos.update({pid=>{var=>val}})
#					end
#				elsif(element == 'V1event')
#					check_com_stat(pid,data[element]['alarmType']['updateTime'])
#					if(block['alarmType']['value'] != data[element]['alarmType']['value'])	# data is changed
#						block['alarmType'] = data[element]['alarmType']
#						val = 'on' if(data[element]['alarmType']['value'] == 21 || data[element]['alarmType']['value'] == 24 || data[element]['alarmType']['value'] == 27 || data[element]['alarmType']['value'] == 155)
#						val = 'off' if(data[element]['alarmType']['value'] == 19 || data[element]['alarmType']['value'] == 22 || data[element]['alarmType']['value'] == 25)
#						cos.update({pid=>{"stat"=>val}})
#					end
#				end
#			rescue
#			end
#		end
#		return cos
#	end
	def update(key,data)
		return nil if(key.shift != 'data')
		element = key.shift
		cos = nil
		begin
			if(is_int?(element) == true)
				################################################
				check_com_stat(@id_link[element],data['event']['updateTime'],data['event']['invalidateTime'])
				################################################
#				puts "CHECK UPDATE: #{@id_link[element]} #{element} #{data['event']['value']}"
				if(@data[element]['event']['value'] != data['event']['value'])
					# data is updated
					@data[element]['event'] = data['event']
					var = find_var_from_data(element)
					val = 'on' if(data['event']['value'] == 3 || data['event']['value'] == 22 || data['event']['value'] == 2)
					val = 'off' if(data['event']['value'] == 0 || data['event']['value'] == 23)
					if(element == "7" && var == "stat")
						val = 'on' if(data['event']['value'] == 8)
						val = 'off' if(data['event']['value'] == 0)
#						val = 'err' if(data['event']['value'] == 3)
					end
					cos = {var=>val}
				end
			elsif(element == 'V1event')
				################################################
				check_com_stat(@id_link[element],data['alarmType']['updateTime'],data['alarmType']['invalidateTime'])
				################################################
				if(@data[element]['alarmType']['value'] != data['alarmType']['value'])
					# data is updated
					@data[element]['alarmType'] = data['alarmType']
					val = 'on' if(data['alarmType']['value'] == 21 || data['alarmType']['value'] == 24 || data['alarmType']['value'] == 27 || data['alarmType']['value'] == 155)
					val = 'off' if(data['alarmType']['value'] == 19 || data['alarmType']['value'] == 22 || data['alarmType']['value'] == 25)
					cos = {"stat"=>val}
				end
			end
		rescue => e
			puts "ERROR: #{e}"
			cos = {}
		end
		return @id_link[element],cos
	end

	def get_value(data)
		data = data.to_s
		if(data == 'V1event')
			return 'on' if(@data[data]['alarmType']['value'] == 21 || @data[data]['alarmType']['value'] == 24 || @data[data]['alarmType']['value'] == 27 || @data[data]['alarmType']['value'] == 155)
			return 'off' if(@data[data]['alarmType']['value'] == 19 || @data[data]['alarmType']['value'] == 22 || @data[data]['alarmType']['value'] == 25)
		else
			return 'on' if(@data[data]['event']['value'] == 3 || @data[data]['event']['value'] == 22)
			return 'off' if(@data[data]['event']['value'] == 0 || @data[data]['event']['value'] == 23)
		end 
	end
end

class DoorLock < CommandClass #98
	def initialize(instance,command_data_tree)
		super
		@commandClass = 98
	end

	def get_point_list
		pid = @instance.device.generate_pid
		@id_link['mode'] = pid
		return {pid=>{"type"=>"Dio","device"=>@instance.device.id,"pointData"=>{"stat"=>{"instance"=>@instance.id,"commandClass"=>98,"data"=>"mode"}}}}
	end

#	def update(data)
#		pid = @id_link['mode']
#		check_com_stat(pid,data['mode']['updateTime'])
#		if(@data['mode']['value'] != data['mode']['value'])	# data is changed
#			@data['mode'] = data['mode']
#		end
#		return {}
#	end
	def update(key,data)
		return nil if(key.shift != 'data')
		element = key.shift
		return nil if(element != 'mode')
		cos = {}
		begin
			################################################
			check_com_stat(@id_link[element],data['updateTime'],data['invalidateTime'])
			################################################
			if(@data['mode']['value'] != data['value'])
				# data is updated
				@data['mode'] = data
				ret = 'off'
				ret = 'on' if(data['value'] == 255)
				cos = {"stat"=>ret}
			end
		rescue
			cos = {}
		end
		return @id_link[element],cos
	end

	def convert_command(value)
		value = 0 if(value == 'off')
		value = 255 if(value == 'on')
		return value
	end

	def get_value(data)
		ret = 'off'
		ret = 'on' if(@data[data]['value'] == 255)
		return ret
	end
end

class Meter < CommandClass #50
	def initialize(instance,command_data_tree)
		super
		@commandClass = 50
	end

	def get_point_list
		return {} if(@data['0'] == nil)
		pid = @instance.device.generate_pid
		@id_link['0'] = pid
		@id_link['2'] = pid
		return {pid=>{"type"=>"SmartPi","device"=>@instance.device.id,"pointData"=>{"meter"=>{"instance"=>@instance.id,"commandClass"=>50,"data"=>0},"power"=>{"instance"=>@instance.id,"commandClass"=>50,"data"=>2}}}}
	end

	def check_initial_com_stat
		@id_link.each do |key,id|
			com_stat = false
			com_stat = true if(@data[key] != nil && @data[key]['val']['updateTime'] > @data[key]['val']['invalidateTime'])
			@last_update[id] = {'com_stat'=>com_stat,'time'=>@data[key]['val']['invalidateTime'],'counter'=>0}
		end
	end

#	def update(data)
#		cos = {}
#		@data.each do |element,block|
#			pid = @id_link[element]
#			begin
#				check_com_stat(pid,data[element]['val']['updateTime'])
#				if(block['val']['value'] != data[element]['val']['value'])	# data is changed
#					block['val'] = data[element]['val']
#					mode = 'meter'
#					mode = 'power' if(element == '2')
#					cos.update({pid=>{mode=>data[element]['val']['value']}})
#				end
#			rescue
#			end
#		end
#		return cos
#	end
	def update(key,data)
		return nil if(key.shift != 'data')
		element = key.shift
		cos = nil
		begin
			################################################
			check_com_stat(@id_link[element],data['val']['updateTime'],data['val']['invalidateTime'])
			################################################
			if(element == '0')
				if(@data['0']['val']['value'] != data['val']['value'])
					# data is updated
					@data['0']['val'] = data['val']
					cos = {"meter"=>data['val']['value']}
				end
			elsif(element == '2')
				if(@data['2']['val']['value'] != data['val']['value'])
					# data is updated
					@data['2']['val'] = data['val']
					cos = {"power"=>data['val']['value']}
				end
			end
		rescue
			cos = {}
		end
		return @id_link[element],cos
	end

	def set_attribute(data)
		data['attr'] = {'unit'=>@data[data['data'].to_s]['scaleString']['value'],'sensorType'=>@data[data['data'].to_s]['sensorTypeString']['value']}
	end

	def get_value(data)
		data = data.to_s
		return @data[data]['val']['value']
	end
end

class Battery < CommandClass #128
	def initialize(instance,command_data_tree)
		super
		@commandClass = 128
	end

	def get_point_list
		pid = @instance.device.generate_pid
		@id_link['last'] = pid
		return {pid=>{"type"=>"Ai","device"=>@instance.device.id,"pointData"=>{"av"=>{"instance"=>@instance.id,"commandClass"=>128,"data"=>"last"}}}}
	end

#	def update(data)
#		pid = @id_link['last']
#		check_com_stat(pid,data['last']['updateTime'])
#		if(@data['last']['value'] != data['last']['value'])	# data is changed
#			@data['last'] = data['last']
#			cos = {pid=>{'level'=>data['last']['value']}}
#		end
#		return {}
#	end
	def update(key,data)
		return nil if(key.shift != 'data')
		element = key.shift
		return nil if(element != 'last')
		cos = nil
		begin
			################################################
			check_com_stat(@id_link['last'],data['updateTime'],data['invalidateTime'])
			################################################
			if(@data['last']['value'] != data['value'])
				# data is updated
				@data['last'] = data
				cos = {"battery"=>data['value']}
			end
		rescue
			cos = {}
		end
		return @id_link['last'],cos
	end

	def set_attribute(data)
		data['attr'] = {'unit'=>'%'}
	end

	def get_value(data)
		return @data['last']['value']
	end
end

class CentralScene < CommandClass #91
	def initialize(instance,command_data_tree)
		super
		@commandClass = 91
		@currentStat = {}	#{id=>'on'/'off'}
	end

	def get_point_list
		pid = @instance.device.generate_pid
		@id_link['currentScene'] = pid
		@id_link['keyAttribute'] = pid
		@currentStat[pid] = 'off'
		return {pid=>{"type"=>"Scene","device"=>@instance.device.id,"pointData"=>{"value"=>{"instance"=>@instance.id,"commandClass"=>91,"data"=>"currentScene"},"stat"=>{"instance"=>@instance.id,"commandClass"=>91,"data"=>"keyAttribute"}}}}
	end

#	def update(data)
#		cos = {}
#		@data.each do |element,block|
#			pid = @id_link[element]
#			begin
#				check_com_stat(pid,data[element]['updateTime'])
#				if(block['value'] != data[element]['value'])	# data is changed
#					block = data[element]
#					mode = 'scene'
#					mode = 'stat' if(element == 'keyAttribute')
#					cos.update({pid=>{mode=>data[element]['value']}})
#				end
#			rescue
#			end
#		end
#		return cos
#	end
	def update(key,data)
		return nil if(key.shift != 'data')
		element = key.shift
		cos = nil
		begin
			################################################
			check_com_stat(@id_link[element],data['updateTime'],data['invalidateTime'])
			################################################
#			if(element == 'currentScene')
#				if(@data['currentScene']['value'] != data['value'])
					# data is updated
#					@data['currentScene'] = data
#					cos = {"scene"=>data['value']}
#				end
#			elsif(element == 'keyAttribute')
#				if(@data['keyAttribute']['value'] != data['value'])
					# data is updated
#					@data['keyAttribute'] = data
#					cos = {"stat"=>data['value']}
#				end
#			end
			if(element == 'keyAttribute')
#				puts "***********************"
#				puts "#{data}"
#				puts "#{@data['keyAttribute']}"
#				puts "#{@id_link[element]} #{@currentStat[@id_link[element]]}"

				if(data['value'] == 0 && data['updateTime'] != @data['keyAttribute']['updateTime'])
					if(@currentStat[@id_link[element]] == 'on')
						@currentStat[@id_link[element]] = 'off' 
					else
						@currentStat[@id_link[element]] = 'on'
					end
					cos = {"stat"=>@currentStat[@id_link[element]]}
				end
				@data['keyAttribute'] = data
			end

		rescue
			cos = {}
		end
		return @id_link[element],cos
	end

	def get_value(data)
		data = data.to_s
		return @data[data]['value']
	end
end

class SensorBinary < CommandClass #48
	def initialize(instance,command_data_tree)
		super
		@commandClass = 48
	end

	def get_point_list
		point_list = {}
		@data.each_key do |key|
			next if(is_int?(key) == false)
			pid = @instance.device.generate_pid
			point_list[pid] = {"type"=>"Di","device"=>@instance.device.id,"pointData"=>{"stat"=>{"instance"=>@instance.id,"commandClass"=>48,"data"=>key.to_s}}}
			@id_link[key] = pid
		end
		return point_list
	end

#	def update(data)
#		cos = {}
#		@data.each do |element,block|
#			begin
#				pid = @id_link[element]
#				next if(pid == nil)
#				check_com_stat(pid,data[element]['level']['updateTime'])
#				if(block['level']['value'] != data[element]['level']['value'])	# data is changed
#					block['level'] = data[element]['level']
#					cos.update({pid=>{'stat'=>data[element]['value']}})
#				end
#			rescue
#			end
#		end
#		return cos
#	end
	def update(key,data)
		return nil if(key.shift != 'data')
		element = key.shift
		return nil if(is_int?(element) == false)
		cos = nil
		begin
			################################################
			check_com_stat(@id_link[element],data['updateTime'],data['invalidateTime'])
			################################################
			if(@data[element]['level']['value'] != data['value'])
				# data is updated
				@data[element]['level'] = data['level']
				val = 'off'
				val = 'on' if(@data[element]['level']['value'] == true)
				cos = {"stat"=>val}
			end
		rescue
			cos = {}
		end
		return @id_link[element],cos
	end

	def get_value(data)
		val = 'off'
		val = 'on' if(@data[data]['level']['value'] == true)
		return val
	end
end

## when command class is added, Instance::create_command_classes should be modified

## command class template
#class new Command Class < CommandClass
#	def make_cos(key, data)
#	end
#
#	def get_status
#		stat = {}
#
#		return stat
#	end
#end
###################################

#zwave = ZWave.new
#zwave.setup({:hostname=>'192.168.0.102'})
#zwave.init
#zwave.operate(2,2,'av',10)
#point_list = zwave.get_point_list
#puts point_list
#puts zwave.get_point_value
#puts point_list
#zwave.devices.each do |id,dev|
#	puts "#{dev.point_list}"
#end