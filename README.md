# `hosts2` Tutorial

`hosts2` 是一个方便管理 hosts 配置文件的工具

使用`hosts2`，你可以通过预先建立一些不同开发阶段或不同项目使用的 hosts 配置文件（称之为 profile），然后使用一条简单的命令在这些 profile 之间快速切换。

### 安装

最简单的方式是通过 npm 来安装 `hosts2`

	# 通过 npm 安装
	npm install -g hosts2
	
### 使用

#### 增加 profile

	# 增加一个 profile
	# 多个 hosts 条目可以通过 "," 来分割
	hosts2 add dev "127.0.0.1 a.tbcdn.cn"
	
	# >> 这条命令会在用户根目录的 .hosts2_profiles 目录下建立一个名为 dev 的文件
	# >> 文件内容为：	"127.0.0.1 a.tbcdn.cn"

#### 显示 profile

	# 显示 <hosts2> 当前维护的 profile
	hosts2 ls
	
	# >> 这条命令会打印出所有的 profile，包括 profile 名字和内容
	# >> 附加 -q 选项只打印 profile 名字
	# >> 也可以通过附加 profile 参数来显示特定 profile 的内容：hosts2 ls dev
	
#### 删除 profile
	
	# 删除一个 profile
	hosts2 remove dev
	
	# >> 这条命令会把名为 dev 的 profile 从 hosts2 中删除
	# >> 注意：删除的 profile 不可恢复
	
#### 切换 profile
	
	# 切换到某一个或某一组 profile
	hosts2 on dev
	
	# >> 这条命令会把 dev profile 文件中的 hosts 记录附加到系统 hosts 文件中
	# >> 若指定一个以上的 profile，则会按顺序附加 profiles 里的内容
	# >> 操作完成后 hosts2 会自动清除系统 DNS 缓存
	# >> 注意：不同浏览器可能还有特定的 DNS 缓存失效时间
	
#### 重置 hosts

	# 重置系统 hosts
	hosts2 reset
	
	# >> 这条命令会把 hosts2 附加到系统 hosts 文件中的记录全部清除
	# >> 系统原有的 hosts 记录不会被清除


**PS：如果你喜欢，也可以直接在用户根目录下的 .hosts2_profiles 目录下维护 profiles**