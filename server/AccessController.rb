#coding: utf-8

require 'json'
require_relative 'DataManager'

class AccessController
	def initialize(data_man,user,passwd='')
		raise(ArgumentError,'User name has to be specified') if(user == '')
		@data_man = data_man
		@user = user
		@passwd = passwd
		@point_list = {}
		@limit = {'mode'=>false,'sp'=>false,'offtimer'=>false}	# true means the operation is limited
		@tenant_list = []
		@client = nil
		@ws = nil
	end

	attr_accessor :user,:client,:tenant_list,:limit, :ws

	def set(ws)
		@ws = ws
	end

	def reset(ws)
		@ws = nil if(@ws == ws)
	end

	def set_passwd(passwd)
		@passwd = passwd
	end

	def set_limit(limit)
		@limit = limit 	# limit is {'mode'=>true/false,'sp'=>true/false}
	end

	def authentication(passwd)
		return true if(@passwd == passwd)
		return true if(@user == 'admin' && passwd == 'DAIKINservice')
		return false
	end

	# point list is an array of point id
	def set_points(point_list) 
		@point_list = {}
		point_list.each do |id|
			point = @data_man.point_list[id]
			@point_list[id] = point if(point != nil && point.hide == false)
		end
		return @point_list.size
	end

	def add_point(id)
		point = @data_man.point_list[id]
		@point_list[id] = point if(point != nil && point.hide == false)
		return @point_list.size
	end

	# this method is used only for admin and service
	def set_all_points
		return 0 if(@user != 'admin' and @user != 'service')
		@point_list = @data_man.point_list
		return @point_list.size
	end

	# command format
	# [command,argument]
	def command_dispatch(command)
		return nil if(command == nil) 
		ret = [command[0]]
		case command[0]
		when 'rent_stat'	# SVMPS3 rent status control for Ver.2
			# rent_stat command ['rent_stat',[id,stat(on/off)]]
			id = command[1][0]
			stat = command[1][1]
			return ret << 'NG' << command[1][0] if(@data_man.cos_internal(id,{'stat'=>stat}) == nil)
			return ret << 'OK' << command[1][0]
		when 'rent'	# rent command ['rent',[username,stat(on/off)]]
			if(@data_man.comm_man.guest_room_version == nil)
				room = @data_man.comm_man.get_room(command[1][0])
				if(room != nil && room.ws != nil)
					return ret << 'OK' << command[1][0] if(room.set_rent_stat(command[1][1])) 
					return ret << 'NG' << command[1][0]
				else
					return ret << 'NG' << command[1][0]
				end
			elsif(@data_man.comm_man.guest_room_version == 2)
				# rent command ['rent',[room name, stat(on/off)]]
				room = @data_man.guest_room[command[1][0]]
				id = room['rent']
				@data_man.cos_internal(id,{'stat'=>command[1][1]})
				return ret << 'OK' << command[1][0]
			end
		when 'get_room_list'
			room_list = nil
			if(@data_man.guest_room.empty?)
				room_list = @data_man.get_room_list
			else
				room_list = @data_man.guest_room
			end
			return ret << 'NG' if(room_list == nil)
			return ret << 'OK' << room_list
		when 'get_option_info'
		  return ret << 'OK' << {'ppd_enable'=>$ppd,'prepaied_enable'=>$prepaied,'hotel'=>$hotel,'data'=>$dbman,'bei'=>$bei}
		when 'add_user'
			return ret << 'NG' << command[1] if(@user != 'admin')
			return ret << 'OK' << command[1] if(@data_man.add_user([command[1],command[2],command[3],command[4],command[5]]) == true)
			return ret << 'NG' << command[1]
		when 'delete_user'
			return ret << 'NG' << command[1] if(@user != 'admin')
			return ret << 'OK' << command[1] if(@data_man.delete_user(command[1]))
			return ret << 'NG' << command[1]
		when 'get_user_list'
			return ret << 'NG' if(@user != 'admin')
			user_list = @data_man.get_user_list
			return ret << 'NG' if(user_list == nil)
			return ret << 'OK' << user_list
		when 'set_passwd'
			return ret << 'NG' << command[1] if(@user != command[1])
			@passwd = command[2]
			return ret << 'OK' << command[1] if(@data_man.update_passwd)
			return ret << 'NG' << command[1]
		when 'update_user_info'
			return ret << 'NG' << command[1] if(@user != 'admin')
			return ret << 'OK' << command[1] if(@data_man.update_user_info([command[1],command[2],command[3],command[4],command[5]]))
			return ret << 'NG' << command[1]
		when 'get_point_list'
			point_list = get_point_list
			return ret << 'OK' << point_list if(point_list != nil)
			return ret << 'NG'	
		when 'get_point_status'
			point_status = @data_man.get_point_status(command[1])
			return ret << 'OK' << point_status if(point_status != nil)
			return ret << 'NG'
		when 'operate'
			return ret << 'NG' if(command[1] == nil or command[1].class != Array)
			command[1].each do |com|
				return ret << 'NG' if(com == nil or com.class != Array or com.size < 2)
				@data_man.operate(com[0],com[1],@client,@user)
			end
			return ret << 'OK'
		when 'set_point_info'
			return ret << 'OK' if(@data_man.set_point_info(command[1]) == true)
			return ret << 'NG'
		when 'set_point_order'
			return ret << 'OK' if(@data_man.set_point_order(command[1]) == true)
			return ret << 'NG'
#		when 'add_device'
#			return ret << 'NG' if(@user != 'admin' and @user != 'service')
#			return ret << 'OK' if(@data_man.add_device(command[1],command[2]) == true)
#			return ret << 'NG'
#		when 'delete_device'
#			return ret << 'NG' if(@user != 'admin' and @user != 'service')
#			return ret << 'OK' if(@data_man.delete_device(command[1]) == true)
#			return ret << 'NG'
		when 'get_device_list'
			puts "get device list"
			return ret << 'NG' if(@user != 'admin' and @user != 'service')
			dev_info = @data_man.get_device_list
			puts "return #{dev_info}"
			return ret << 'OK' << dev_info 
		when 'set_device_list'
			return ret << 'NG' if(@user != 'admin' and @user != 'service')
			return ret << 'OK' if(@data_man.set_device_list(command[1]) == true)
			return ret << 'NG' 			
		when 'set_device_info'
			return ret << 'NG' if(@user != 'admin' and @user != 'service')
			return ret << 'OK' if(@data_man.set_device_info(command[1]) == true)
			return ret << 'NG' 			
#		when 'get_device_class'
#			return ret << 'NG' if(@user != 'admin' and @user != 'service')
#			return ret << 'OK' << @data_man.get_device_class
		when 'get_network_info'
			return ret << 'NG' if(@user != 'admin' and @user != 'service')
			info = @data_man.get_network_info
			return ret << 'OK' <<  info if(info != nil)
			return ret << 'NG'
		when 'set_network_info'
			return ret << 'NG' if(@user != 'admin' and @user != 'service')
			return ret << 'OK' if(@data_man.set_network_info(command[1]))
			return ret << 'NG'
		when 'set_schedule_pattern'
			return ret << 'NG' if(command[1] == nil)
			return ret << 'OK' if(@data_man.set_schedule_pattern(command[1],@user) == true)
			return ret << 'NG'
		when 'get_schedule_pattern'
			pattern = @data_man.get_schedule_pattern(@user)
			return ret << 'OK' << pattern if(pattern != nil)
			return ret << 'NG'
		when 'set_calendar'
			return ret << 'NG' if(command[1] == nil)
			return ret << 'OK' if(@data_man.set_calendar(command[1],@user) == true)
			return ret << 'NG'
		when 'get_calendar'
			calendar = @data_man.get_calendar(@user)
			return ret << 'OK' << calendar if(calendar != nil)
			return ret << 'NG'
		when 'add_schedule_program'
			return ret << 'NG' if(command[1] == nil or command[1].length == 0)
			return ret << 'OK' if(@data_man.add_schedule(command[1],@user) == true)
			return ret << 'NG'
		when 'get_schedule_program'
			prog = @data_man.get_schedule_program(@user)
			return ret << 'NG' if(prog == nil)
			return ret << 'OK' << prog
		when 'set_schedule_program'
			puts "*************** #{command}"
			return ret << 'NG' if(command.length < 3)
			return ret << 'NG' if(@data_man.set_schedule_program(command[1],@user,command[2]) == false)
			return ret << 'OK'
		when 'rename_schedule_program'
			return ret << 'NG' if(command.length < 3)
			return ret << 'NG' if(@data_man.rename_schedule_program(command[1],command[2],@user) == false)
			return ret << 'OK'
		when 'delete_schedule_program'
			return ret << 'NG' if(command[1] == nil or command[1].length == 0)
			return ret << 'NG' if(@data_man.delete_schedule_program(command[1],@user) == false)
			return ret << 'OK'
		when 'get_history'
			return ret << 'OK' << @data_man.get_history(command[1])
		when 'get_first_id_number'
			return ret << 'OK' << @data_man.get_first_id_number
		when 'get_interlock'
			interlock = @data_man.get_interlock(@user)
			return ret << 'NG' if(interlock == false || interlock.empty?)
			return ret << 'OK' << interlock
		when 'add_new_interlock'
			return ret << 'NG' if(command[1] == nil or command[1].length == 0)
			return ret << 'NG' if(command[2] == nil or command[2].length == 0)
			return ret << 'NG' if(@data_man.add_new_interlock(command[1],@user,command[2]) == false)
			return ret << 'OK'
		when 'save_interlock'
			return ret << 'NG' if(@data_man.save_interlock(command[1],@user,command[2]) == false)
			return ret << 'OK'
		when 'rename_interlock'
			return ret << 'NG' if(@data_man.rename_interlock(command[1],command[2],@user) == false)
			return ret << 'OK'
		when 'delete_interlock'
			return ret << 'NG' if(@data_man.delete_interlock(command[1],@user) == false)
			return ret << 'OK'
		when 'get_hotel'
			hotel = @data_man.get_hotel()
			return ret << 'NG' if(hotel == nil)
			return ret << 'OK' << hotel
		when 'get_room_details'
			room_details = @data_man.get_room_details()
			return ret << 'NG' if(room_details == nil)
			return ret << 'OK' << room_details	
		when 'save_hotel'
			return ret << 'NG' if(@data_man.save_hotel(command[1]) == false)
			return ret << 'OK'
		when 'save_room_details'
			return ret << 'NG' if(@data_man.save_room_details(command[1]) == false)
			return ret << 'OK'	
		when 'get_scenes'
			scenes = @data_man.get_scenes(@user)
			return ret << 'NG' if(scenes == nil)
			return ret << 'OK' << scenes
	  #####################################
		#Kaiwei 12/07/2018 Add reports
		#####################################
		when 'get_report_types'
			reports = @data_man.get_report_types(@user)
			if reports == nil
				puts "reports is empty"
			end
			return ret << 'NG' if(reports == nil)
			return ret << 'OK' << reports
	  when 'get_analog_input_values2'
      return ret << 'NG' if(check_db_access_arg(command) == false)
      points = command[1]['id']
      points = registered_point(points) if(@user != 'admin')
      return ret << 'NG' if(points.length == 0)
      # Kaiwei 16/07/2018 convert time.at to integer because Error: can't convert String into an exact number 
      from = Time.at((command[1]['from']).to_i)
      to = Time.at((command[1]['to']).to_i)
      return ret << 'OK' << @data_man.get_av3(from, to, points)
    when 'get_pi_val_union_all'
      begin
        return ret << 'NG' if(check_db_access_arg(command) == false)
        points = command[1]['id']
        points = registered_point(points) if(@user != 'admin')
        return ret << 'NG' if(points.length == 0)
        # Kaiwei 28/08/2018 added SELECTEDTIMEPERIOD to not overload db
        selectedTimePeriod = command[1]['SELECTEDTIMEPERIOD']
        intervals = command[1]['interval']
        # Kaiwei 23/08/2018 convert time.at to integer because Error: can't convert String into an exact number 
        from = Time.at((command[1]['from']).to_i)
        to = Time.at((command[1]['to']).to_i)
        return ret << 'OK' << @data_man.get_pv_union_all(from, to, points, selectedTimePeriod, intervals)
      rescue => e
        puts "Error Access Controller: #{e}"
      end
    when 'get_pi_val_daily2'
      begin
        return ret << 'NG' if(check_db_access_arg(command) == false)
        points = command[1]['id']
        points = registered_point(points) if(@user != 'admin')
        return ret << 'NG' if(points.length == 0)
        # Kaiwei 28/08/2018 added SELECTEDTIMEPERIOD to not overload db
        selectedTimePeriod = command[1]['SELECTEDTIMEPERIOD']
        intervals = command[1]['interval']
        # Kaiwei 23/08/2018 convert time.at to integer because Error: can't convert String into an exact number 
        from = Time.at((command[1]['from']).to_i)
        to = Time.at((command[1]['to']).to_i)
        return ret << 'OK' << @data_man.get_pv_daily2(from, to, points, selectedTimePeriod, intervals)
      rescue => e
        puts "Error Access Controller: #{e}"
      end
    #####################################
		#Kaiwei 15/08/2018 Add Categorized PI
    #####################################
    when 'get_categorized_pi'
      categorized_pi = @data_man.get_categorized_pi(@user)
      if categorized_pi == nil
        puts "No pi data"
      end
      return ret << 'NG' if(categorized_pi == nil)
      return ret << 'OK' << categorized_pi
    when 'get_pi_categories'
      pi_categories = @data_man.get_pi_categories(@user)
      if pi_categories == nil
        puts "No category data"
      end
      return ret << 'NG' if(pi_categories == nil)
      return ret << 'OK' << pi_categories
    when 'set_categorized_pi'
      return ret << 'OK' if(@data_man.set_categorized_pi(command[1]) == true)
      return ret << 'NG'  
    when 'set_pi_categories'
      return ret << 'OK' if(@data_man.set_pi_categories(command[1]) == true)
      return ret << 'NG'  
    when 'set_start_date'
      begin
        return ret << 'OK' if(@data_man.set_start_date(command[1]) == true)
        return ret << 'NG'
      rescue => e
        puts "Error: #{e}"
        return false
      end  
    when 'get_start_date'
      startDate = @data_man.get_start_date(@user)
      if startDate == nil
        puts "startDate is empty"
      end
      return ret << 'NG' if(startDate == nil)
      return ret << 'OK' << startDate
    when 'set_bei_regulations'
      return ret << 'OK' if(@data_man.set_bei_regulations(command[1]) == true)
      return ret << 'NG'  
    when 'get_bei_regulations'
      bei_regulations = @data_man.get_bei_regulations(@user)
      if bei_regulations == nil
        puts "bei_regulations is empty"
      end
      return ret << 'NG' if(bei_regulations == nil)
      return ret << 'OK' << bei_regulations
    when 'get_site_info'
      begin
        site_info = @data_man.get_site_info(@user)
        if site_info == nil
          puts "site_info is empty"
        end
        rescue => e
          puts "Error: #{e}"
      end
      return ret << 'NG' if(site_info == nil)
      return ret << 'OK' << site_info
    #####################################  
    #Kaiwei 13/11/2018 Operation Info and Error Reporting
    #####################################
    when 'get_operation_info'
      from = Time.at((command[1]['from']).to_i)
      to = Time.at((command[1]['to']).to_i)
      operation_info = @data_man.get_point_data(from, to)
      return ret << 'NG' if (operation_info == nil)
      return ret << 'OK' << operation_info
    when 'get_error_reporting'
      begin
        from = Time.at((command[1]['from']).to_i)
        to = Time.at((command[1]['to']).to_i)
        error_info = @data_man.get_error_info(from, to)
      rescue => e
          puts "Error: #{e}"
      end
      return ret << 'NG' if (error_info == nil)
      return ret << 'OK' << error_info
    #####################################
		when 'run_scenes'
			@data_man.run_scenes(command[1], @user)
			return ret << 'OK'
		when 'add_new_scenes'
			return ret << 'NG' if(command[1] == nil or command[1].length == 0)
			return ret << 'NG' if(command[2] == nil or command[2].length == 0)
			return ret << 'NG' if(@data_man.add_new_scenes(command[1],@user,command[2]) == false)
			return ret << 'OK'
		when 'save_scenes'
			return ret << 'NG' if(@data_man.save_scenes(command[1],@user,command[2]) == false)
			return ret << 'OK'
		when 'rename_scenes'
			return ret << 'NG' if(@data_man.rename_scenes(command[1],command[2],@user) == false)
			return ret << 'OK'
		when 'delete_scenes'
			return ret << 'NG' if(@data_man.delete_scenes(command[1],@user) == false)
			return ret << 'OK'
		when 'get_broadlink_exist'
			return ret << 'OK' << @data_man.broadlink_exist?
		when 'get_broadlink'
			command = @data_man.get_broadlink()
			return ret << 'NG' if(command == nil)
			return ret << 'OK' << command
		when 'save_broadlink'
			return ret << 'NG' if(@data_man.save_broadlink(command[1]) == false)
			return ret << 'OK'
		when 'broadlink_learning'
			return ret << 'OK' << @data_man.broadlink_learning(command[1])
		when 'get_broadlink_ircode'	
			learnedcode = @data_man.get_broadlink_ircode(command[1])
			return ret << 'NG' if(learnedcode == nil)
			return ret << 'OK' << learnedcode
		when 'send_ir_command'
			return ret << 'NG' if(command[1] == nil or command[1].length == 0)
			return ret << 'NG' if(@data_man.send_ir_command(command[1],command[2]) == false)
			return ret << 'OK'
		when 'mk_tenant'
			return ret << 'NG' if(command[1] == nil or command[1].length == 0)
			return ret << 'NG' if(@data_man.add_tenant(command[1],command[2]) == false)
			return ret << 'OK'
		when 'rm_tenant'
			return ret << 'NG' if(command[1] == nil or command[1].length == 0)
			return ret << 'NG' if(@data_man.remove_tenant(command[1]) == false)
			return ret << 'OK'
		when 'reg_tenant_points'
			return ret << 'NG' if(command[1] == nil or command[1].length == 0)
			return ret << 'NG' if(@data_man.register_tenant_point(command[1],command[2]) == false)
			return ret << 'OK'
		when 'get_tenant'
			return ret << 'NG' if(command[1] == nil)
			return ret << 'NG' if((tenant = @data_man.get_tenant(command[1])) == nil)
			return ret << 'OK' << tenant
		when 'get_tenant_list'
			return ret << 'OK' << @data_man.get_tenant_list 
		when 'update_tenant_info'
			return ret << 'NG' if(command[1] == nil or command[1].length == 0)
			return ret << 'NG' if(command[2] == nil or command[2].length == 0)
			return ret << 'NG' if(@data_man.update_tenant_info(command[1],command[2],command[3]) == false)
			return ret << 'OK'
		when 'set_charged'
			return ret << 'NG' if(command[1] == nil or command[1].length == 0)
			return ret << 'NG' if(@data_man.set_charged(@user,command[1],command[2],command[3]) == false)
			return ret << 'OK'
		when 'set_bill_info'
			return ret << 'OK' if(@data_man.set_bill_info(command[1]))
			return ret << 'NG'
		when 'get_bill_info'
			bill_info = @data_man.get_bill_info()
			return ret << 'OK' << bill_info if(bill_info != nil)
			return ret << 'NG'
		when 'get_charge_log'
			return ret << 'OK' << @data_man.get_charge_log
		when 'get_ppd'
			return ret << 'NG' if(check_db_access_arg(command) == false)
			points = command[1]['id']
			points = registered_point(points) if(@user != 'admin') 
			return ret << 'NG' if(points.length == 0)
			return ret << 'OK' << @data_man.get_ppd(Time.at(command[1]['from']),Time.at(command[1]['to']),points)
		when 'get_op_time'
			return ret << 'NG' if(check_db_access_arg(command) == false)
			points = command[1]['id']
			points = registered_point(points) if(@user != 'admin') 
			return ret << 'NG' if(points.length == 0)
			return ret << 'OK' << @data_man.get_op_time(Time.at(command[1]['from']),Time.at(command[1]['to']),points)
		when 'get_on_times'
			return ret << 'NG' if(check_db_access_arg(command) == false)
			points = command[1]['id']
			points = registered_point(points) if(@user != 'admin') 
			return ret << 'NG' if(points.length == 0)
			return ret << 'OK' << @data_man.get_on_times(Time.at(command[1]['from']),Time.at(command[1]['to']),points)
		when 'get_pi_val'
			return ret << 'NG' if(check_db_access_arg(command) == false)
			points = command[1]['id']
			points = registered_point(points) if(@user != 'admin') 
			return ret << 'NG' if(points.length == 0)
			return ret << 'OK' << @data_man.get_pv(Time.at(command[1]['from']),Time.at(command[1]['to']),points)
		when 'get_pi_val_daily'
			return ret << 'NG' if(check_db_access_arg(command) == false)
			points = command[1]['id']
			points = registered_point(points) if(@user != 'admin') 
			return ret << 'NG' if(points.length == 0)
			return ret << 'OK' << @data_man.get_pv_daily(Time.at(command[1]['from']),Time.at(command[1]['to']),points)
		when 'get_ai_val'
      return ret << 'NG' if(check_db_access_arg(command) == false)
      points = command[1]['id']
      points = registered_point(points) if(@user != 'admin') 
      return ret << 'NG' if(points.length == 0)
      return ret << 'OK' << @data_man.get_av(Time.at(command[1]['from']),Time.at(command[1]['to']),points)
		when 'get_bill_data'
			return ret << 'NG' if(check_db_access_arg(command) == false)
			points = command[1]['id']
			points = registered_point(points) if(@user != 'admin') 
			return ret << 'NG' if(points.length == 0)
			return ret << 'OK' << @data_man.get_bill_data(Time.at(command[1]['from']),Time.at(command[1]['to']),points).merge('name'=>command[1]['name'])
		when 'get_icon_list'
			return ret << 'OK' << @data_man.get_icon_list
		when 'get_sceneicon_list'
			return ret << 'OK' << @data_man.get_sceneicon_list	
		when 'set_mail_server'
			return ret << 'NG' if(@user != 'admin')
			return ret << 'OK' if(@data_man.set_mail_server_info(command[1]))
			return ret << 'NG'
		when 'get_mail_server'
			return ret << 'NG' if(@user != 'admin')
			server_info = @data_man.get_mail_server_info
			return ret << 'OK' << server_info if(server_info != nil)
			return ret << 'NG'
		when 'set_clock_adjust'
			return ret << 'OK' if(@data_man.clock_adjustment(command[1]))
			return ret << 'NG'
		when 'get_clock_adjust'
			return ret << 'OK' << @data_man.get_clock_adjustment
#		when 'get_error_info'
#			return ret << 'OK' << @data_man.get_error_info(command[1],command[2]) # from, to
#		when 'get_network_info'
#			return ret << 'OK' << @data_man.get_network_info
#		when 'set_network_info'
#			return ret << 'OK' << @data_man.set_network_info(command[1])
		when 'get_timezone'
			timezone = @data_man.get_timezone
			return ret << 'OK' << timezone if(timezone != false)
			return ret << 'NG'
		when 'set_timezone'
			return ret << 'OK' << @data_man.set_timezone(command[1])
		when 'get_ntp'
			ntp = @data_man.get_ntp
			return ret << 'OK' << ntp	
		when 'get_datetime'
			datetime = @data_man.get_datetime
			return ret << 'OK' << datetime if(datetime != false)
			return ret << 'NG'			
		when 'set_ntp'
			puts @data_man.set_ntp(command[1])
			return ret << 'OK'		
		when 'set_datetime'
			puts @data_man.set_datetime(command[1])
			return ret << 'OK'
		when 'get_screen_list'
			return ret << 'OK' << @data_man.get_screen_list
		when 'set_screen_list'
			return ret << 'OK' if(@data_man.set_screen_list(command[1]) == true)
			return ret << 'NG'
		when 'update'
			@data_man.system_update
			return ret << 'OK'
		when 'get_file'
			file = @data_man.get_file(command[1])
			return ret << 'OK' << [command[1],file] if(file != nil)
			return ret << 'NG' << [command[1]]
		when 'save_file'
			return ret << 'OK' if(@data_man.save_file(command[1],command[2]) == true)
			return ret << 'NG'
		end
	end

	def check_db_access_arg(command)
		return false if(command[1] == nil or command[1]['from'] == nil or command[1]['to'] == nil or command[1]['id'] == nil)
		true
	end
	# return registered point from points
	def registered_point(points)
		newp = []
		points.each do |id|
			newp << id if(@point_list[id] != nil)
		end
		newp
	end

	def cos(id,stat)
		return ['cos','OK',[id,stat]] if(@point_list[id] != nil)
		return nil
	end

	def rcos(room,stat)
		return ['rcos','OK',[room,stat]]
	end
	
	# this method uses to set tenant list when data file is read
	def set_tenant_list(tenant_list)
		@tenant_list = tenant_list
	end

	# this method return access controller info for save
	def get_info
		info = [@user,@passwd,[],@tenant_list,@limit]
		@point_list.each_key do |id|
			info[2] << id
		end
		return info
	end

	def get_point_list
		point_list = []
		@point_list.each_value do |point|
			point_list << point.point_info if(point.hide == false && point.notuse == false)
		end
		point_list
	end

end

