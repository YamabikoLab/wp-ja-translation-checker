// Generated from docs/architecture/v1-architecture.md. Do not edit manually.
workspace "WP Translation Checker v1 Architecture" {
	!impliedRelationships false

	model {
		EXT_USER_PO_FILE = element "Local PO File" "External System" "利用者が確認対象として選択するローカルの .po ファイル。" {
			tags "External Context,External System"
			!script groovy {
				element.setGroup("Browser Input")
			}
		}
		EXT_BROWSER_FILE_CAPABILITY = element "Browser File Capability" "External Capability" "選択されたローカルファイルの内容をブラウザー内で読み取る能力を提供する。" {
			tags "External Context,External Capability"
			!script groovy {
				element.setGroup("Browser Input")
			}
		}
		EXT_STYLE_GUIDE = element "WordPress Japanese Translation Style Guide" "External System" "各指摘の根拠として利用者が任意に参照する一次情報。" {
			tags "External Context,External System"
			!script groovy {
				element.setGroup("Reference Information")
			}
		}

		RESP_PRESENTATION = element "Result Presentation" "Responsibility" "確認入力、利用者向け状態、確認結果、重要なフィードバックを表示する。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Presentation")
			}
		}
		RESP_CHECK_ORCHESTRATION = element "Check Orchestration" "Responsibility" "1回の確認要求を開始し、入力から確認全体の結果までの処理を調整する。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Validation Core")
			}
		}
		RESP_PO_INTERPRETATION = element "PO Interpretation" "Responsibility" "入力ファイルを検証可能な翻訳エントリとメタデータへ解釈する。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Validation Core")
			}
		}
		RESP_LOCALE_RESOLUTION = element "Locale Resolution" "Responsibility" "PO メタデータから対象ロケールを判定し、判定不能を区別する。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Validation Core")
			}
		}
		RESP_LOCALE_RULE_SELECTION = element "Locale Rule Selection" "Responsibility" "判定済みロケールに対応するルール集合を選択し、未対応を区別する。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Validation Core")
			}
		}
		RESP_RULE_EVALUATION = element "Rule Evaluation" "Responsibility" "選択されたロケールルールを翻訳エントリへ適用し、ルール固有の検出結果を生成する。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Validation Core")
			}
		}
		RESP_FINDING_COORDINATION = element "Finding Coordination" "Responsibility" "ルール固有の検出結果を重複・優先関係・集約・順序の規則に従って最終 Finding へ整える。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Validation Core")
			}
		}

		DEP_001 = RESP_PRESENTATION -> RESP_CHECK_ORCHESTRATION "利用者向け確認結果と確認不能状態を得るために確認全体の処理境界を必要とする。" {
			tags "Structural Dependency"
		}
		DEP_002 = RESP_PRESENTATION -> EXT_BROWSER_FILE_CAPABILITY "ローカルファイルを選択・読み取り可能な入力能力を利用するため。" {
			tags "Structural Dependency"
		}
		DEP_003 = RESP_CHECK_ORCHESTRATION -> RESP_PO_INTERPRETATION "確認対象を検証可能な翻訳エントリとメタデータへ解釈する必要があるため。" {
			tags "Structural Dependency"
		}
		DEP_004 = RESP_CHECK_ORCHESTRATION -> RESP_LOCALE_RESOLUTION "解釈済み入力の対象ロケールを判定する必要があるため。" {
			tags "Structural Dependency"
		}
		DEP_005 = RESP_CHECK_ORCHESTRATION -> RESP_LOCALE_RULE_SELECTION "判定済みロケールに適用可能なルール集合を決定する必要があるため。" {
			tags "Structural Dependency"
		}
		DEP_006 = RESP_CHECK_ORCHESTRATION -> RESP_RULE_EVALUATION "選択済みルール集合による検出結果を得る必要があるため。" {
			tags "Structural Dependency"
		}
		DEP_007 = RESP_CHECK_ORCHESTRATION -> RESP_FINDING_COORDINATION "個別検出結果を一貫した最終 Finding へ整える必要があるため。" {
			tags "Structural Dependency"
		}
		DEP_008 = RESP_PO_INTERPRETATION -> EXT_USER_PO_FILE "確認対象であるローカル PO 内容を解釈するため。" {
			tags "Structural Dependency"
		}

		PF_001 = EXT_USER_PO_FILE -> RESP_PRESENTATION "利用者が選択した確認対象が WTC の利用フローへ入る。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_002 = RESP_PRESENTATION -> RESP_CHECK_ORCHESTRATION "確認要求が検証処理の調整責務へ進む。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_003 = RESP_CHECK_ORCHESTRATION -> RESP_PO_INTERPRETATION "確認対象の解釈処理へ進む。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_004 = RESP_PO_INTERPRETATION -> RESP_LOCALE_RESOLUTION "解釈済みメタデータからロケール判定へ進む。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_005 = RESP_LOCALE_RESOLUTION -> RESP_LOCALE_RULE_SELECTION "判定済みロケールから適用ルール集合の選択へ進む。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_006 = RESP_LOCALE_RULE_SELECTION -> RESP_RULE_EVALUATION "選択済みロケールルールによる評価へ進む。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_007 = RESP_RULE_EVALUATION -> RESP_FINDING_COORDINATION "個別ルールの検出結果が指摘調整へ進む。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_008 = RESP_FINDING_COORDINATION -> RESP_CHECK_ORCHESTRATION "調整済み Finding が確認全体の結果へ統合される。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_009 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "確認全体の結果が利用者向け表示へ進む。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_010 = RESP_PO_INTERPRETATION -> RESP_CHECK_ORCHESTRATION "[failure] 入力を確認可能な PO として解釈できない状態が確認全体の結果へ戻る。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_FAILURE_BOUNDARIES,failure"
		}
		PF_011 = RESP_LOCALE_RESOLUTION -> RESP_CHECK_ORCHESTRATION "[failure] 対象ロケールを判定できない状態が確認全体の結果へ戻る。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_FAILURE_BOUNDARIES,failure"
		}
		PF_012 = RESP_LOCALE_RULE_SELECTION -> RESP_CHECK_ORCHESTRATION "[failure] 判定済みロケールが未対応である状態が確認全体の結果へ戻る。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_FAILURE_BOUNDARIES,failure"
		}
		PF_013 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "[recovery] 確認不能理由を利用者が理解できる安定した表示状態へ戻す。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_FAILURE_BOUNDARIES,recovery"
		}

		RT_001 = RESP_PRESENTATION -> RESP_CHECK_ORCHESTRATION "確認開始時点の選択入力を対象として確認を要求する。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS,Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.1" "確認開始時点の選択入力を対象として確認を要求する。"
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.1" "確認開始時点の選択入力を対象として確認を要求する。"
			}
		}
		RT_002 = RESP_CHECK_ORCHESTRATION -> RESP_PO_INTERPRETATION "入力を翻訳エントリとメタデータへ解釈するよう求める。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS,Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.2" "入力を翻訳エントリとメタデータへ解釈するよう求める。"
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.2" "入力を翻訳エントリとメタデータへ解釈するよう求める。"
			}
		}
		RT_003 = RESP_CHECK_ORCHESTRATION -> RESP_LOCALE_RESOLUTION "解釈済みメタデータから対象ロケールの判定を求める。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS,Runtime_RV_SUCCESS_WITHOUT_FINDINGS,Runtime_RV_UNRESOLVED_LOCALE"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.3" "解釈済みメタデータから対象ロケールの判定を求める。"
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.3" "解釈済みメタデータから対象ロケールの判定を求める。"
				"runtime.RV_UNRESOLVED_LOCALE.step.1" "解釈済みメタデータから対象ロケールの判定を求める。"
			}
		}
		RT_004 = RESP_CHECK_ORCHESTRATION -> RESP_LOCALE_RULE_SELECTION "判定済みロケールに対応するルール集合の選択を求める。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS,Runtime_RV_SUCCESS_WITHOUT_FINDINGS,Runtime_RV_UNSUPPORTED_LOCALE"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.4" "判定済みロケールに対応するルール集合の選択を求める。"
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.4" "判定済みロケールに対応するルール集合の選択を求める。"
				"runtime.RV_UNSUPPORTED_LOCALE.step.1" "判定済みロケールに対応するルール集合の選択を求める。"
			}
		}
		RT_005 = RESP_CHECK_ORCHESTRATION -> RESP_RULE_EVALUATION "翻訳エントリへ選択済みルール集合を適用するよう求める。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS,Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.5" "翻訳エントリへ選択済みルール集合を適用するよう求める。"
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.5" "翻訳エントリへ選択済みルール集合を適用するよう求める。"
			}
		}
		RT_006 = RESP_CHECK_ORCHESTRATION -> RESP_FINDING_COORDINATION "ルール固有の検出結果を最終 Finding 集合へ整えるよう求める。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.6" "ルール固有の検出結果を最終 Finding 集合へ整えるよう求める。"
			}
		}
		RT_007 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "指摘あり正常完了として確認全体の結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.7" "指摘あり正常完了として確認全体の結果を通知する。"
			}
		}
		RT_008 = RESP_CHECK_ORCHESTRATION -> RESP_FINDING_COORDINATION "検出結果を空の最終 Finding 集合へ整えるよう求める。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.6" "検出結果を空の最終 Finding 集合へ整えるよう求める。"
			}
		}
		RT_009 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "指摘なし正常完了として確認全体の結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.7" "指摘なし正常完了として確認全体の結果を通知する。"
			}
		}
		RT_010 = RESP_PRESENTATION -> RESP_CHECK_ORCHESTRATION "選択入力の確認を要求する。" {
			tags "Runtime Interaction,Runtime_RV_INVALID_PO_INPUT"
			properties {
				"runtime.RV_INVALID_PO_INPUT.step.1" "選択入力の確認を要求する。"
			}
		}
		RT_011 = RESP_CHECK_ORCHESTRATION -> RESP_PO_INTERPRETATION "入力の解釈を求める。" {
			tags "Runtime Interaction,Runtime_RV_INVALID_PO_INPUT"
			properties {
				"runtime.RV_INVALID_PO_INPUT.step.2" "入力の解釈を求める。"
			}
		}
		RT_012 = RESP_PO_INTERPRETATION -> RESP_CHECK_ORCHESTRATION "確認可能な PO として解釈できないことを通知する。" {
			tags "Runtime Interaction,Runtime_RV_INVALID_PO_INPUT"
			properties {
				"runtime.RV_INVALID_PO_INPUT.step.3" "確認可能な PO として解釈できないことを通知する。"
			}
		}
		RT_013 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "入力解析不能として確認全体の結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_INVALID_PO_INPUT"
			properties {
				"runtime.RV_INVALID_PO_INPUT.step.4" "入力解析不能として確認全体の結果を通知する。"
			}
		}
		RT_014 = RESP_LOCALE_RESOLUTION -> RESP_CHECK_ORCHESTRATION "対象ロケールを判定できないことを通知する。" {
			tags "Runtime Interaction,Runtime_RV_UNRESOLVED_LOCALE"
			properties {
				"runtime.RV_UNRESOLVED_LOCALE.step.2" "対象ロケールを判定できないことを通知する。"
			}
		}
		RT_015 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "ロケール判定不能として確認全体の結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_UNRESOLVED_LOCALE"
			properties {
				"runtime.RV_UNRESOLVED_LOCALE.step.3" "ロケール判定不能として確認全体の結果を通知する。"
			}
		}
		RT_016 = RESP_LOCALE_RULE_SELECTION -> RESP_CHECK_ORCHESTRATION "対応ルール集合が存在しない未対応ロケールであることを通知する。" {
			tags "Runtime Interaction,Runtime_RV_UNSUPPORTED_LOCALE"
			properties {
				"runtime.RV_UNSUPPORTED_LOCALE.step.2" "対応ルール集合が存在しない未対応ロケールであることを通知する。"
			}
		}
		RT_017 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "未対応ロケールとして確認全体の結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_UNSUPPORTED_LOCALE"
			properties {
				"runtime.RV_UNSUPPORTED_LOCALE.step.3" "未対応ロケールとして確認全体の結果を通知する。"
			}
		}
		RT_018 = RESP_PRESENTATION -> RESP_CHECK_ORCHESTRATION "旧入力を対象とする確認を開始する。" {
			tags "Runtime Interaction,Runtime_RV_INPUT_REPLACED"
			properties {
				"runtime.RV_INPUT_REPLACED.step.1" "旧入力を対象とする確認を開始する。"
			}
		}
		RT_019 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "旧入力に対応付いた確認結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_INPUT_REPLACED"
			properties {
				"runtime.RV_INPUT_REPLACED.step.2" "旧入力に対応付いた確認結果を通知する。"
			}
		}
	}

	views {
		systemLandscape "DV_WTC_OVERVIEW" {
			title "Structural Dependencies - WTC Overview"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_LOCALE_RULE_SELECTION RESP_RULE_EVALUATION RESP_FINDING_COORDINATION EXT_USER_PO_FILE EXT_BROWSER_FILE_CAPABILITY
			exclude "relationship.tag!=Structural Dependency"
			autoLayout lr
		}

		systemLandscape "DV_VALIDATION_CORE" {
			title "Structural Dependencies - Validation Core"
			include RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_LOCALE_RULE_SELECTION RESP_RULE_EVALUATION RESP_FINDING_COORDINATION EXT_USER_PO_FILE
			exclude "relationship.tag!=Structural Dependency"
			autoLayout lr
		}

		systemLandscape "DV_PRESENTATION_BOUNDARY" {
			title "Structural Dependencies - Presentation Boundary"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION EXT_BROWSER_FILE_CAPABILITY
			exclude "relationship.tag!=Structural Dependency"
			autoLayout lr
		}

		custom "PV_VALIDATION_END_TO_END" {
			title "Process Flow - Validation End-to-End"
			include EXT_USER_PO_FILE RESP_PRESENTATION RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_LOCALE_RULE_SELECTION RESP_RULE_EVALUATION RESP_FINDING_COORDINATION
			exclude "relationship.tag!=ProcessFlow_PV_VALIDATION_END_TO_END"
			autoLayout lr
		}

		custom "PV_VALIDATION_FAILURE_BOUNDARIES" {
			title "Process Flow [Failure / Recovery] - Validation Failure Boundaries"
			include RESP_PO_INTERPRETATION RESP_CHECK_ORCHESTRATION RESP_LOCALE_RESOLUTION RESP_LOCALE_RULE_SELECTION RESP_PRESENTATION
			exclude "relationship.tag!=ProcessFlow_PV_VALIDATION_FAILURE_BOUNDARIES"
			autoLayout lr
		}

		custom "RV_SUCCESS_WITH_FINDINGS" {
			title "Runtime - Successful validation with findings"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_LOCALE_RULE_SELECTION RESP_RULE_EVALUATION RESP_FINDING_COORDINATION
			exclude "relationship.tag!=Runtime_RV_SUCCESS_WITH_FINDINGS"
			properties {
				"runtime.steps" "1=RT_001;2=RT_002;3=RT_003;4=RT_004;5=RT_005;6=RT_006;7=RT_007"
			}
			autoLayout lr
		}

		custom "RV_SUCCESS_WITHOUT_FINDINGS" {
			title "Runtime - Successful validation without findings"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_LOCALE_RULE_SELECTION RESP_RULE_EVALUATION RESP_FINDING_COORDINATION
			exclude "relationship.tag!=Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.steps" "1=RT_001;2=RT_002;3=RT_003;4=RT_004;5=RT_005;6=RT_008;7=RT_009"
			}
			autoLayout lr
		}

		custom "RV_INVALID_PO_INPUT" {
			title "Runtime - Invalid PO input"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION
			exclude "relationship.tag!=Runtime_RV_INVALID_PO_INPUT"
			properties {
				"runtime.steps" "1=RT_010;2=RT_011;3=RT_012;4=RT_013"
			}
			autoLayout lr
		}

		custom "RV_UNRESOLVED_LOCALE" {
			title "Runtime - Unresolved locale"
			include RESP_CHECK_ORCHESTRATION RESP_LOCALE_RESOLUTION RESP_PRESENTATION
			exclude "relationship.tag!=Runtime_RV_UNRESOLVED_LOCALE"
			properties {
				"runtime.steps" "1=RT_003;2=RT_014;3=RT_015"
			}
			autoLayout lr
		}

		custom "RV_UNSUPPORTED_LOCALE" {
			title "Runtime - Unsupported locale"
			include RESP_CHECK_ORCHESTRATION RESP_LOCALE_RULE_SELECTION RESP_PRESENTATION
			exclude "relationship.tag!=Runtime_RV_UNSUPPORTED_LOCALE"
			properties {
				"runtime.steps" "1=RT_004;2=RT_016;3=RT_017"
			}
			autoLayout lr
		}

		custom "RV_INPUT_REPLACED" {
			title "Runtime - Input replaced during validation"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION
			exclude "relationship.tag!=Runtime_RV_INPUT_REPLACED"
			properties {
				"runtime.steps" "1=RT_018;2=RT_019"
			}
			autoLayout lr
		}

		styles {
			element "Responsibility" {
				shape Box
			}
			element "External System" {
				shape RoundedBox
				background #f8fafc
				color #344054
				stroke #667085
				border solid
			}
			element "External Block" {
				shape Component
				background #eef4ff
				color #344054
				stroke #6172f3
			}
			element "External Capability" {
				shape Hexagon
				background #f4f3ff
				color #344054
				stroke #7f56d9
			}
			element "External Environment" {
				shape Box
				background #f2f4f7
				color #344054
				stroke #98a2b3
				border dashed
			}
			element "External Library" {
				shape Box
				background #fff7ed
				color #344054
				stroke #f79009
				border dashed
			}
			relationship "Structural Dependency" {
				style solid
			}
			relationship "Runtime Interaction" {
				style solid
			}
			relationship "normal" {
				style solid
			}
			relationship "failure" {
				color #b42318
				style dashed
				thickness 3
			}
			relationship "recovery" {
				color #b54708
				style dotted
				thickness 3
			}
		}
	}
}
