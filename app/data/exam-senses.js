/* Original pedagogical glosses and examples. Word-level exam counts are not sense frequencies. */
(function(root,factory){const data=factory();if(typeof module==='object'&&module.exports)module.exports=data;else root.WordWorldExamSenses=data;})(typeof window==='undefined'?null:window,function(){
 const rows=[
 ['address','地址；称呼','v. 处理，应对','address a problem','The policy fails to address the underlying causes.','这项政策未能解决根本原因。','address a problem ≠ an email address'],
 ['account','账户','v. 解释……的原因','account for a change','Several factors account for the difference.','几个因素解释了这一差异。','account for = 解释原因或占比例；take into account = 考虑到'],
 ['issue','问题；议题','v. 发布，发行','issue a warning','The agency issued a warning.','该机构发布了警告。','an important issue 是名词；issue a statement 是动词'],
 ['substantial','实质性的','adj. 大量的，相当可观的','substantial savings','The change led to substantial savings.','这一改变带来了可观的节省。','substantial evidence 可表示大量或充分的证据'],
 ['assume','假定','v. 承担（职责）；呈现','assume responsibility','Managers must assume responsibility for their decisions.','管理者必须为自己的决定承担责任。','assume that + 从句：假定；assume a role：担任角色'],
 ['attribute','属性；特征','v. 将……归因于','attribute A to B','They attribute the increase to better public transport.','他们把增长归因于更好的公共交通。','attribute A to B：把结果 A 归因于原因 B'],
 ['subject','主题；学科','adj. 受……约束；可能遭受','be subject to approval','The proposal is subject to approval.','该提案须经批准。','subject to change：可能变动；subject 作名词时也可指受试者'],
 ['conduct','行为；举止','v. 开展，实施','conduct a survey','The researchers conducted a survey.','研究人员开展了一项调查。','conduct research / an experiment：开展研究 / 实验'],
 ['benefit','益处；福利','v. 从……获益','benefit from','Many workers benefit from flexible hours.','许多员工从弹性工作时间中获益。','benefit from A：从 A 获益；benefit A：使 A 受益'],
 ['claim','声称；主张','v. 要求；索取','claim compensation','Residents can claim compensation for their losses.','居民可以要求损失赔偿。','claim that：声称；claim compensation：要求赔偿'],
 ['charge','收费；充电','负责，管理（词块）','in charge of','She is in charge of the project.','她负责这个项目。','in charge of：负责；a charge of theft：盗窃指控'],
 ['decline','下降，衰退','v. 婉拒','decline an offer','She declined the offer of a promotion.','她婉拒了升职的提议。','a decline in sales：销售下降；decline an invitation：拒绝邀请'],
 ['approach','接近','n. 方法，途径','an approach to solving a problem','A different approach may be needed.','可能需要另一种方法。','approach to + 名词或动名词：……的方法'],
 ['evidence','证据','n. 支持判断的依据','evidence to support a claim','There is little evidence to support the claim.','几乎没有证据支持这一主张。','evidence 通常不可数；a piece of evidence 表示一条证据'],
 ['maintain','维持；保养','v. 坚持认为，主张','maintain that','The authors maintain that the policy is effective.','作者坚持认为这项政策有效。','maintain a system：维护系统；maintain that：坚持认为'],
 ['significant','重要的','adj. 显著的；数量可观的','a significant difference','The findings suggest a significant difference.','研究结果表明存在显著差异。','statistically significant 专指统计上显著，不必然表示实际影响大'],
 ['context','语境','n. 背景，环境','in the context of','The findings must be understood in their historical context.','这些发现必须放在历史背景下理解。','in the context of：在……背景下'],
 ['obtain','得到','v. 存在，通行（正式用法）','conditions that obtain','Different conditions obtain in rural areas.','农村地区存在不同的条件。','obtain data：获得数据；conditions obtain：条件存在'],
 ['contribute','贡献；捐助','v. 促成，是……的成因之一','contribute to','Several factors contribute to the problem.','几个因素促成了这一问题。','contribute to + 名词或动名词，不一定是正面贡献'],
 ['interpret','解释；口译','v. 将……理解为','interpret A as B','Readers may interpret the passage differently.','读者可能对这段文字有不同理解。','interpret A as B：把 A 理解为 B'],
 ['object','物体；目标','v. 反对','object to doing','Some residents object to the plan.','一些居民反对这一计划。','object to + 名词或动名词；注意名词与动词重音'],
 ['view','景色；观点','v. 将……看作','view A as B','Many people view education as an investment.','许多人把教育视为一项投资。','view A as B：把 A 看作 B'],
 ['fine','好的；精细的','n. 罚款；v. 处以罚款','pay a fine','The company was ordered to pay a fine.','该公司被责令支付罚款。','a fine distinction：细微区别；pay a fine：缴纳罚款'],
 ['rate','比率；速度','v. 评价，评级','rate A as B','Participants rated the service as satisfactory.','参与者认为服务令人满意。','growth rate：增长率；rate A as B：将 A 评为 B'],
 ["concern","关心；涉及","n. 担忧；令人担忧的事","a growing concern","Privacy is a growing concern among users.","隐私问题越来越令用户担忧。","concern about 表示对……的担忧；as far as X is concerned 表示就 X 而言。"],
 ["appeal","呼吁；吸引","n. 上诉；v. 提起上诉","appeal against a decision","The company appealed against the ruling.","公司对该裁决提起了上诉。","appeal to consumers：吸引消费者；appeal against a ruling：对裁决上诉。"],
 ["figure","数字；人物","v. 认为；估计","figure that","I figured that the plan would cost too much.","我估计该计划成本会过高。","figure that：认为；figure out：弄清楚；a public figure：公众人物。"],
 ["impose","强加于","v. 征收；施加（限制）","impose restrictions on","The government imposed restrictions on water use.","政府对用水施加了限制。","impose a tax on：对……征税；impose restrictions on：限制……。"],
 ["extend","延伸；延展","v. 延长（期限）；提供","extend a deadline","The university agreed to extend the deadline.","大学同意延长截止日期。","extend a deadline：延长期限；extend an invitation：发出邀请。"],
 ["reflect","反射；反映","v. 仔细思考","reflect on","Students were asked to reflect on their experiences.","学生被要求认真思考自己的经历。","reflect changes：反映变化；reflect on a decision：反思决定。"],
 ["engage","吸引；使参加","v. 参与；从事","engage in debate","Citizens should be able to engage in public debate.","公民应当能够参与公共讨论。","engage in：参与；engage with：与……互动或认真处理。"],
 ["observe","观察","v. 遵守（规则或习俗）","observe the rules","All visitors must observe the safety rules.","所有访客都必须遵守安全规则。","observe an animal：观察动物；observe the law：遵守法律。"],
 ["bear","携带；承受","v. 负担（成本或责任）","bear the cost","Consumers may have to bear the extra cost.","消费者可能不得不承担额外成本。","bear responsibility：承担责任；bear in mind：牢记。"],
 ["appreciate","欣赏；感激","v. 充分认识到；理解","appreciate the importance of","We need to appreciate the complexity of the problem.","我们需要充分认识这个问题的复杂性。","appreciate your help：感谢帮助；appreciate the risks：认识到风险。"],
 ["hold","握着；坚持","v. 认为；主张","hold the view that","Some economists hold the view that prices will rise.","一些经济学家认为价格会上涨。","hold a meeting：举行会议；hold that：主张，认为。"],
 ["draw","画画","v. 得出（结论）；引起","draw a conclusion","It is too early to draw a firm conclusion.","现在下定论还为时过早。","draw a conclusion：得出结论；draw attention to：引起对……的注意。"]
 ];
 const polysemy=new Set(['address','account','issue','assume','attribute','subject','conduct','claim','charge','decline','maintain','obtain','object','view','fine','rate',"concern","appeal","figure","observe","bear","appreciate","hold","draw"]);
 const additional={
  account:[{id:'account-proportion',meaning:'占（比例）',phrase:'account for 40% of the total',example:'Online sales account for 40% of total revenue.',translation:'线上销售占总收入的40%。'}],
  subject:[{id:'subject-participant',meaning:'受试者；研究对象',phrase:'research subjects',example:'Each subject completed a questionnaire.',translation:'每名受试者填写了一份问卷。'}],
  fine:[{id:'fine-distinction',meaning:'细微的；精细的',phrase:'a fine distinction',example:'There is a fine distinction between the two concepts.',translation:'这两个概念之间存在细微差别。'}]
 };
 return Object.fromEntries(rows.map(([word,base,focus,phrase,example,translation,contrast])=>[word,{word,base,focus,phrase,example,translation,contrast,additional:additional[word]||[],kind:polysemy.has(word)?'polysemy':'usage',source:'原创学习释义与例句；未核实义项考频'}]));
});
/* Independent use-focused items for words not covered by the original skill bank. */
(function(){if(typeof window==='undefined')return;
 const specs=[
 ['decline-sense','decline','context','decline an offer：婉拒提议',[['The applicant declined the offer.','declined',['下降','婉拒','申请','提高'],1],['She declined an invitation to the conference.','declined',['参加','发出','婉拒','取消'],2]]],
 ['assume-sense','assume','context','assume responsibility：承担责任',[['The agency will assume responsibility for the project.','assume',['推测','承担','放弃','检查'],1],['She assumed a leading role in the negotiations.','assumed',['担任','想象','拒绝','评价'],0]]],
 ['maintain-sense','maintain','context','maintain that：坚持认为',[['The authors maintain that the policy is effective.','maintain',['维护设备','坚持认为','降低','记录'],1],['Some critics maintain that the evidence is insufficient.','maintain',['计算','保养','坚持认为','忽略'],2]]],
 ['attribute-collocation','attribute','collocation','attribute A to B：将 A 归因于 B',[['Researchers attribute the decline ___ rising costs.','',['for','with','to','of'],2],['They attributed the improvement ___ better training.','',['to','at','for','by'],0]]],
 ['approach-collocation','approach','collocation','an approach to doing：做某事的方法',[['We need a new approach ___ solving the problem.','',['for','to','of','by'],1],['The paper proposes an approach ___ measuring inequality.','',['at','from','to','with'],2]]],
 ['contribute-sense','contribute','context','contribute to：促成，不一定是正面贡献',[['Poor planning contributed to the delays.','contributed to',['促成','预防','取消','预测'],0],['Lack of sleep can contribute to poor concentration.','contribute to',['提高','替代','导致','减轻'],2]]],
 ['rate-sense','rate','context','rate A as B：将 A 评为 B',[['Participants rated the service as satisfactory.','rated',['收费','评价','加速','计算'],1],['Most reviewers rated the film highly.','rated',['租用','下载','评价','播放'],2]]],
 ['claim-sense','claim','context','claim compensation：要求赔偿',[['Residents may claim compensation for their losses.','claim',['要求','放弃','测量','支付'],0],['Workers can claim benefits if they meet the conditions.','claim',['扣除','申请领取','捐赠','拒绝'],1]]],
 ["concern-worry","concern","context","concern about 表示对……的担忧；as far as X is concerned 表示就 X 而言。",[["The cost of housing remains a major concern.","concern",["关注的具体措施","令人担忧的问题","商业公司","研究结论"],1],["Safety concerns delayed the project.","concerns",["担忧","赞同","预算","承诺"],0]]],
 ["appeal-legal","appeal","context","appeal to consumers：吸引消费者；appeal against a ruling：对裁决上诉。",[["The defendant decided to appeal against the verdict.","appeal",["求助","上诉","吸引","赞成"],1],["The court rejected his appeal.","appeal",["呼吁","提案","上诉","吸引力"],2]]],
 ["figure-think","figure","context","figure that：认为；figure out：弄清楚；a public figure：公众人物。",[["She figured that the train would be late.","figured",["计算票价","认为","描绘","公布"],1],["We figured that demand would fall.","figured",["赞美","绘制","估计","拒绝"],2]]],
 ["impose-restriction","impose","context","impose a tax on：对……征税；impose restrictions on：限制……。",[["The city imposed a tax on plastic bags.","imposed",["取消","征收","退还","调查"],1],["The rules impose limits on advertising.","impose",["放宽","审查","施加","撤销"],2]]],
 ["extend-deadline","extend","context","extend a deadline：延长期限；extend an invitation：发出邀请。",[["The editor agreed to extend the deadline by a week.","extend",["缩短","延长","宣布","遵守"],1],["They extended the lease for another year.","extended",["终止","签订","延长","检查"],2]]],
 ["reflect-think","reflect","context","reflect changes：反映变化；reflect on a decision：反思决定。",[["Take time to reflect on the reasons for the failure.","reflect on",["反射","认真思考","记录","忽略"],1],["She reflected on what she had learned.","reflected on",["拒绝","背诵","反思","报告"],2]]],
 ["engage-participate","engage","context","engage in：参与；engage with：与……互动或认真处理。",[["Young people engage in volunteer work.","engage in",["避免","参与","阻止","评价"],1],["Researchers engage in discussions across disciplines.","engage in",["结束","旁观","参与","限制"],2]]],
 ["observe-obey","observe","context","observe an animal：观察动物；observe the law：遵守法律。",[["Drivers must observe the speed limit.","observe",["观察","遵守","提高","取消"],1],["The company failed to observe the regulations.","observe",["修改","制定","遵守","公布"],2]]],
 ["bear-cost","bear","context","bear responsibility：承担责任；bear in mind：牢记。",[["Who will bear the cost of repairs?","bear",["估算","承担","免除","减少"],1],["The firm bears responsibility for the damage.","bears",["逃避","转移","承担","否认"],2]]],
 ["appreciate-understand","appreciate","context","appreciate your help：感谢帮助；appreciate the risks：认识到风险。",[["Few people appreciate the scale of the challenge.","appreciate",["感谢","充分认识","解决","夸大"],1],["The public may not appreciate the risks involved.","appreciate",["降低","接受","认识到","回避"],2]]],
 ["hold-believe","hold","context","hold a meeting：举行会议；hold that：主张，认为。",[["Some scholars hold that the theory is incomplete.","hold",["握住","主张","限制","延期"],1],["They hold the view that education is a public good.","hold",["举办","暂停","持有（观点）","检查"],2]]],
 ["draw-conclusion","draw","context","draw a conclusion：得出结论；draw attention to：引起对……的注意。",[["The researchers drew a conclusion from the data.","drew",["画出","得出","推翻","质疑"],1],["We cannot draw reliable conclusions from one case.","draw",["吸引","绘画","得出","回避"],2]]],
 ["account-proportion","account","context","account for：占某个总量的比例，与解释原因不同。",[["Exports account for a third of total revenue.","account for",["解释原因","占比例","扣除","预计"],1],["Women account for nearly half of the workforce.","account for",["申请","照顾","占比例","描述"],2]]],
 ["subject-participant","subject","context","subject：研究中的受试者。",[["Each subject completed a short questionnaire.","subject",["主题","受试者","课程","物品"],1],["The subjects were randomly assigned to two groups.","subjects",["学科","话题","受试者","理论"],2]]],
 ["fine-distinction","fine","context","fine：细微的，精细的；不同于罚款。",[["There is a fine distinction between the two concepts.","fine",["罚款","细微的","健康的","晴朗的"],1],["The instrument can detect fine differences in temperature.","fine",["严重的","昂贵的","细微的","良好的"],2]]]
 ];
 const extra=specs.map(([id,word,skill,explanation,variants])=>({id,word,skill,explanation,variants:variants.map(([prompt,target,options,correct])=>({prompt,target,options,correct}))}));
 for(const key of ['WORD_WORLD_ABILITIES','WWPreviewSkills'])if(Array.isArray(window[key])){const ids=new Set(window[key].map(i=>i.id));window[key].push(...extra.filter(i=>!ids.has(i.id)));}
})();
