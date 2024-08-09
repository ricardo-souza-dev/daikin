#encoding: utf-8

# extract zip file to specified folder

require 'zip'
require 'fileutils'
require 'net/https'
require 'json'
require 'date'
require 'open-uri'

class RemoteUpdate
	def initialize(server,model,date,region)
		@model = model.split(':')[0]
		@current_ver = Date.parse(date)
		@extract = "../../tmp"
		@update_pack = "../../updater.zip"
		@current_version = date
		@server = server
		@ver_file = "/updater/version.json"
		@updater = "/updater/#{@model}#{region}.zip"	# ex: SVM-R1DSP.zip
		@backup = "../../backup"
	end

	# check updater is exist or not
	def check_updater
		begin
			Net::HTTP.start(@server) do |http|
				res = http.get(@ver_file)
				ver_file = JSON.parse(res.body)
				ver = ver_file[@model]
				return false if(ver == nil)
				ver = Date.parse(ver)
				return true if(ver > @current_ver)
				return false
			end
		rescue
			return false
		end
	end

	# prepare for update
	def preparation
		download = download_updater 
		if(download)
			puts "Update file is downloaded"
			extracted = extract_package
			return true if(extracted)
		end
		puts "Fail to download update file"
		return false
	end

	# download updater zip file
	def download_updater
		begin
			open(@update_pack,"wb") do |io|
				open("https://#{@server}#{@updater}") do |data|
					io.write(data.read)
				end
			end
			return true
		rescue => e
			puts "ERROR: #{e}"
			return false
		end
	end

	def extract_package
		begin
			extract_updater(@extract,@update_pack)
			return true
		rescue => e
			puts "ERROR: #{e}"
			return false
		end
	end

	# copy current program for backup
	def backup
		begin
			# make backup folder
			Dir.mkdir(@backup,0777) if(Dir.exist?(@backup) == false)

			# clear backup folder
			# copy all files to backup folder
			FileUtils.cp_r(Dir.glob("../*"),@backup,{:remove_destination=>true})
			return true
		rescue => e
			puts "ERROR: #{e}"
			return false
		end
	end

	# update all files
	def update
		begin
			# file update package
			FileUtils.cp_r(Dir.glob("#{@extract}/*"),"../")
			FileUtils.chmod_R(0777,Dir.glob("../"))
			return true
		rescue => e
			puts "ERROR: #{e}"
			return false
		end
	end

	# clean up update file
	def clean_up
		FileUtils.rm_rf(@extract) if(Dir.exist?(@extract) == true)
		FileUtils.rm(@update_pack)
	end

# utility methods	
	def extract_updater(folder, zip_file)
		FileUtils.rm_rf(folder) if(Dir.exist?(folder) == true)

		Zip::File.open(zip_file) do |file|
			file.each do |entry|
#				puts "Extracting #{entry.name}"
				dirs = entry.name.split('/')
				mkDirRec(folder,dirs)
				entry.extract("#{folder}/#{entry.name}")
				ext = File.extname(entry.name)
				if(ext == ".js" || ext == ".rb" || ext == ".json" || ext == ".css")
					system("tr -d '\r' < #{folder}/#{entry.name} > #{folder}/#{entry.name}.b")
					system("mv #{folder}/#{entry.name}.b #{folder}/#{entry.name}")
				end
			end
		end
	end

	def mkDirRec(dir,dirs)
		Dir.mkdir(dir,0777) if(Dir.exist?(dir) == false)
		mkDirRec("#{dir}/#{dirs.shift}",dirs) if(dirs.length > 1)
	end
end

#update = RemoteUpdate.new('sis-sin.ddns.net','SVM-C1','2018-02-01')
#if(update.preparation)
#	puts "Backup current version"
#	if(update.backup)
#		if(update.update)
#			update.clean_up
#			puts "Update completed" 
#		end
#	end
#else
#	puts "File to download update file"
#end

