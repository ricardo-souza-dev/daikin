#coding: utf-8

require 'json'
#require_relative 'DataManager'

# old {"scenes": [{"owner": "","name": "","icon": "","output": [{"id": "","command": {}}]}]}		#blank JSON format
# {next:num,owner:{id:{"owner": "","name": "","icon": "","delay1":"","delay2":"","output": [{"id": "","command": {}}]},...},...}

class Scenes
	def initialize(data_man)
		@scenes_file = 'scenes.json'
		@data_man = data_man
		@scenes = {}

		begin
			if(File.exist?(@scenes_file))
				@scenes = @data_man.get_file(@scenes_file)
				if(@scenes != nil && @scenes['scenes'] != nil) # old file
					@scenes = convert(@scenes)	# convert to new format
					@data_man.save_file(@scenes_file,@scenes)
				end
			end	
		rescue => e
			puts "Error: #{e}"
			return false
		end
	end

	def convert(scenes) 
		new_data = {}
		scenes['scenes'].each do |scene|
			id = generate_id
			new_data[scene['owner']] = {} if(new_data[scene['owner']] == nil)
			new_data[scene['owner']].update({id=>scene})
		end
		new_data['next_id'] = scenes['next_id']
		return new_data
	end

	# id: scn-00000
	def generate_id
		@scenes['next_id'] = 0 if(@scenes['next_id'] == nil)
		num = @scenes['next_id']
		@scenes['next_id'] += 1
		return "scn-#{sprintf("%05d",num)}"
	end

	def run_scenes(id, owner)	
		return if(@scenes[owner] == nil)
		scenes = @scenes[owner][id] 
		if(scenes != nil)
			delay1 = scenes['delay1'].to_i												#get delay value from JSON
			delay2 = scenes['delay2'].to_i												#get delay value from JSON
			
			Thread.new do				
				sleep(delay1) if(delay1 != 0)											#First delay before executing commands, delay in seconds.
			
				scenes['output'].each do |output|				
					if(output['id'].start_with?('inl-'))
						@data_man.set_interlock_enable(output['id'],output['command']['interlock']) if(output['command'] != nil)
					else
						@data_man.operate(output['id'],output['command'],'scenes',scenes['name'])
					end
					sleep(delay2) if(delay2 != 0)										#Subsequent delay between each commands, delay in seconds.
				end
				puts "Scene #{scenes['name']} executed."
			end
		end
	end

	# program: {'name':name,'owner':owner,'icon':'',...}
	def add_new_scenes(name, owner, program)
		@scenes[owner] = {} if(@scenes[owner] == nil)
		@scenes[owner].update({generate_id => program})
		@data_man.save_file(@scenes_file,@scenes)
		return true
	end
	
	def delete_scenes(id,owner)
		return false if(@scenes[owner] == nil)
		return false if(@scenes[owner][id] == nil)
		@scenes[owner].delete(id)
		@data_man.save_file(@scenes_file,@scenes)
		return true
	end

	# scenes: {'name':name,'owner':owner,'icon':'',...}
	def save_scenes(id, owner, scenes)
		@scenes[owner] = {} if(@scenes[owner] == nil)
		@scenes[owner][id] = scenes
		@data_man.save_file(@scenes_file,@scenes)
		return true
	end

	def rename_scenes(id, newname, owner)
		return false if(@scenes[owner] == nil)
		return false if(@scenes[owner][id] == nil)
		@scenes[owner][id]['name'] = newname
		@data_man.save_file(@scenes_file,@scenes)
		return true
	end	

	# return : {id:{'name':name,'owner':owner,'icon':'',...}, ....}
	def get_scenes(owner)
		return @scenes[owner]
	end	

end