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

		RESP_PRESENTATION = element "Result Presentation" "Responsibility" "入力、利用者向け状態、確認結果、重要なフィードバックを表示する。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Presentation")
			}
		}
		RESP_CHECK_ORCHESTRATION = element "Check Orchestration" "Responsibility" "1回の確認要求を調整し、確認全体の結果を確定する。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Validation Core")
			}
		}
		RESP_PO_INTERPRETATION = element "PO Interpretation" "Responsibility" "PO を翻訳 entry と metadata へ解釈する。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Validation Core")
			}
		}
		RESP_LOCALE_RESOLUTION = element "Locale Resolution" "Responsibility" "metadata から対象 locale を解決し、判定不能を区別する。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Validation Core")
			}
		}
		RESP_JAPANESE_CHECK = element "Japanese v1 Check" "Responsibility" "日本語 v1 の12ルールを実行し、entry ごとの Error / Warning を返す。" {
			tags "Responsibility"
			!script groovy {
				element.setGroup("Validation Core")
			}
		}

		DEP_001 = RESP_PRESENTATION -> RESP_CHECK_ORCHESTRATION "確認要求を渡し、確認全体の結果を受け取る。" {
			tags "Structural Dependency"
		}
		DEP_002 = RESP_CHECK_ORCHESTRATION -> RESP_PO_INTERPRETATION "入力を Validation Core 用データへ解釈する。" {
			tags "Structural Dependency"
		}
		DEP_003 = RESP_CHECK_ORCHESTRATION -> RESP_LOCALE_RESOLUTION "対象 locale を解決する。" {
			tags "Structural Dependency"
		}
		DEP_004 = RESP_CHECK_ORCHESTRATION -> RESP_JAPANESE_CHECK "locale が ja の場合に日本語 v1 チェックを1回実行する。" {
			tags "Structural Dependency"
		}
		DEP_005 = RESP_PRESENTATION -> EXT_STYLE_GUIDE "利用者が一次情報を確認できるリンクを提示する。" {
			tags "Structural Dependency"
		}

		PF_001 = EXT_USER_PO_FILE -> RESP_PRESENTATION "利用者が確認対象の .po ファイルを選択する。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_002 = RESP_PRESENTATION -> RESP_CHECK_ORCHESTRATION "確認要求を Validation Core へ渡す。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_003 = RESP_CHECK_ORCHESTRATION -> RESP_PO_INTERPRETATION "PO を翻訳 entry と metadata へ解釈する。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_004 = RESP_CHECK_ORCHESTRATION -> RESP_LOCALE_RESOLUTION "metadata から locale を解決する。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_005 = RESP_CHECK_ORCHESTRATION -> RESP_JAPANESE_CHECK "locale が ja の場合、日本語 check(entries) を呼ぶ。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_006 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "正常結果または確認不能理由を Presentation へ返す。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_END_TO_END,normal"
		}
		PF_007 = RESP_PO_INTERPRETATION -> RESP_CHECK_ORCHESTRATION "[failure] PO を確認可能な入力として解釈できない。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_FAILURE_BOUNDARIES,failure"
		}
		PF_008 = RESP_LOCALE_RESOLUTION -> RESP_CHECK_ORCHESTRATION "[failure] 対象 locale を判定できない。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_FAILURE_BOUNDARIES,failure"
		}
		PF_009 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "[recovery] 解決済み locale が未対応、またはその他の確認不能理由を表示へ返す。" {
			tags "Process Flow,ProcessFlow_PV_VALIDATION_FAILURE_BOUNDARIES,recovery"
		}

		RT_001 = RESP_PRESENTATION -> RESP_CHECK_ORCHESTRATION "確認開始時点の選択入力を対象として確認を要求する。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS,Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.1" "確認開始時点の選択入力を対象として確認を要求する。"
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.1" "確認開始時点の選択入力を対象として確認を要求する。"
			}
		}
		RT_002 = RESP_CHECK_ORCHESTRATION -> RESP_PO_INTERPRETATION "入力を翻訳 entry と metadata へ解釈するよう求める。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS,Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.2" "入力を翻訳 entry と metadata へ解釈するよう求める。"
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.2" "入力を翻訳 entry と metadata へ解釈するよう求める。"
			}
		}
		RT_003 = RESP_CHECK_ORCHESTRATION -> RESP_LOCALE_RESOLUTION "解釈済み metadata から対象 locale の判定を求める。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS,Runtime_RV_SUCCESS_WITHOUT_FINDINGS,Runtime_RV_UNRESOLVED_LOCALE,Runtime_RV_UNSUPPORTED_LOCALE"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.3" "解釈済み metadata から対象 locale の判定を求める。"
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.3" "解釈済み metadata から対象 locale の判定を求める。"
				"runtime.RV_UNRESOLVED_LOCALE.step.1" "解釈済み metadata から対象 locale の判定を求める。"
				"runtime.RV_UNSUPPORTED_LOCALE.step.1" "解釈済み metadata から対象 locale の判定を求める。"
			}
		}
		RT_004 = RESP_CHECK_ORCHESTRATION -> RESP_JAPANESE_CHECK "locale が ja のため、日本語 check(entries) を実行する。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS,Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.4" "locale が ja のため、日本語 check(entries) を実行する。"
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.4" "locale が ja のため、日本語 check(entries) を実行する。"
			}
		}
		RT_005 = RESP_JAPANESE_CHECK -> RESP_CHECK_ORCHESTRATION "Error / Warning を含む日本語チェック結果を返す。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.5" "Error / Warning を含む日本語チェック結果を返す。"
			}
		}
		RT_006 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "指摘あり正常完了として確認全体の結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITH_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITH_FINDINGS.step.6" "指摘あり正常完了として確認全体の結果を通知する。"
			}
		}
		RT_007 = RESP_JAPANESE_CHECK -> RESP_CHECK_ORCHESTRATION "指摘がないため空配列を返す。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.5" "指摘がないため空配列を返す。"
			}
		}
		RT_008 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "指摘なし正常完了として確認全体の結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.RV_SUCCESS_WITHOUT_FINDINGS.step.6" "指摘なし正常完了として確認全体の結果を通知する。"
			}
		}
		RT_009 = RESP_PRESENTATION -> RESP_CHECK_ORCHESTRATION "選択入力の確認を要求する。" {
			tags "Runtime Interaction,Runtime_RV_INVALID_PO_INPUT"
			properties {
				"runtime.RV_INVALID_PO_INPUT.step.1" "選択入力の確認を要求する。"
			}
		}
		RT_010 = RESP_CHECK_ORCHESTRATION -> RESP_PO_INTERPRETATION "入力の解釈を求める。" {
			tags "Runtime Interaction,Runtime_RV_INVALID_PO_INPUT"
			properties {
				"runtime.RV_INVALID_PO_INPUT.step.2" "入力の解釈を求める。"
			}
		}
		RT_011 = RESP_PO_INTERPRETATION -> RESP_CHECK_ORCHESTRATION "確認可能な PO として解釈できないことを通知する。" {
			tags "Runtime Interaction,Runtime_RV_INVALID_PO_INPUT"
			properties {
				"runtime.RV_INVALID_PO_INPUT.step.3" "確認可能な PO として解釈できないことを通知する。"
			}
		}
		RT_012 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "入力解析不能として確認全体の結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_INVALID_PO_INPUT"
			properties {
				"runtime.RV_INVALID_PO_INPUT.step.4" "入力解析不能として確認全体の結果を通知する。"
			}
		}
		RT_013 = RESP_LOCALE_RESOLUTION -> RESP_CHECK_ORCHESTRATION "対象 locale を判定できないことを通知する。" {
			tags "Runtime Interaction,Runtime_RV_UNRESOLVED_LOCALE"
			properties {
				"runtime.RV_UNRESOLVED_LOCALE.step.2" "対象 locale を判定できないことを通知する。"
			}
		}
		RT_014 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "locale 判定不能として確認全体の結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_UNRESOLVED_LOCALE"
			properties {
				"runtime.RV_UNRESOLVED_LOCALE.step.3" "locale 判定不能として確認全体の結果を通知する。"
			}
		}
		RT_015 = RESP_LOCALE_RESOLUTION -> RESP_CHECK_ORCHESTRATION "ja 以外の解決済み locale を返す。" {
			tags "Runtime Interaction,Runtime_RV_UNSUPPORTED_LOCALE"
			properties {
				"runtime.RV_UNSUPPORTED_LOCALE.step.2" "ja 以外の解決済み locale を返す。"
			}
		}
		RT_016 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "日本語チェックを実行せず、未対応 locale として結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_UNSUPPORTED_LOCALE"
			properties {
				"runtime.RV_UNSUPPORTED_LOCALE.step.3" "日本語チェックを実行せず、未対応 locale として結果を通知する。"
			}
		}
		RT_017 = RESP_PRESENTATION -> RESP_CHECK_ORCHESTRATION "旧入力を対象とする確認を開始する。" {
			tags "Runtime Interaction,Runtime_RV_INPUT_REPLACED"
			properties {
				"runtime.RV_INPUT_REPLACED.step.1" "旧入力を対象とする確認を開始する。"
			}
		}
		RT_018 = RESP_CHECK_ORCHESTRATION -> RESP_PRESENTATION "旧入力に対応付いた確認結果を通知する。" {
			tags "Runtime Interaction,Runtime_RV_INPUT_REPLACED"
			properties {
				"runtime.RV_INPUT_REPLACED.step.2" "旧入力に対応付いた確認結果を通知する。"
			}
		}
	}

	views {
		systemLandscape "DV_WTC_OVERVIEW" {
			title "Structural Dependencies - WTC Overview"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_JAPANESE_CHECK EXT_STYLE_GUIDE
			exclude "relationship.tag!=Structural Dependency"
			autoLayout lr
		}

		custom "PV_VALIDATION_END_TO_END" {
			title "Process Flow - Validation End-to-End"
			include EXT_USER_PO_FILE RESP_PRESENTATION RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_JAPANESE_CHECK
			exclude "relationship.tag!=ProcessFlow_PV_VALIDATION_END_TO_END"
			autoLayout lr
		}

		custom "PV_VALIDATION_FAILURE_BOUNDARIES" {
			title "Process Flow [Failure / Recovery] - Validation Failure Boundaries"
			include RESP_PO_INTERPRETATION RESP_CHECK_ORCHESTRATION RESP_LOCALE_RESOLUTION RESP_PRESENTATION
			exclude "relationship.tag!=ProcessFlow_PV_VALIDATION_FAILURE_BOUNDARIES"
			autoLayout lr
		}

		custom "RV_SUCCESS_WITH_FINDINGS" {
			title "Runtime - Successful validation with findings"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_JAPANESE_CHECK
			exclude "relationship.tag!=Runtime_RV_SUCCESS_WITH_FINDINGS"
			properties {
				"runtime.steps" "1=RT_001;2=RT_002;3=RT_003;4=RT_004;5=RT_005;6=RT_006"
			}
			autoLayout lr
		}

		custom "RV_SUCCESS_WITHOUT_FINDINGS" {
			title "Runtime - Successful validation without findings"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION RESP_LOCALE_RESOLUTION RESP_JAPANESE_CHECK
			exclude "relationship.tag!=Runtime_RV_SUCCESS_WITHOUT_FINDINGS"
			properties {
				"runtime.steps" "1=RT_001;2=RT_002;3=RT_003;4=RT_004;5=RT_007;6=RT_008"
			}
			autoLayout lr
		}

		custom "RV_INVALID_PO_INPUT" {
			title "Runtime - Invalid PO input"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION RESP_PO_INTERPRETATION
			exclude "relationship.tag!=Runtime_RV_INVALID_PO_INPUT"
			properties {
				"runtime.steps" "1=RT_009;2=RT_010;3=RT_011;4=RT_012"
			}
			autoLayout lr
		}

		custom "RV_UNRESOLVED_LOCALE" {
			title "Runtime - Unresolved locale"
			include RESP_CHECK_ORCHESTRATION RESP_LOCALE_RESOLUTION RESP_PRESENTATION
			exclude "relationship.tag!=Runtime_RV_UNRESOLVED_LOCALE"
			properties {
				"runtime.steps" "1=RT_003;2=RT_013;3=RT_014"
			}
			autoLayout lr
		}

		custom "RV_UNSUPPORTED_LOCALE" {
			title "Runtime - Unsupported locale"
			include RESP_CHECK_ORCHESTRATION RESP_LOCALE_RESOLUTION RESP_PRESENTATION
			exclude "relationship.tag!=Runtime_RV_UNSUPPORTED_LOCALE"
			properties {
				"runtime.steps" "1=RT_003;2=RT_015;3=RT_016"
			}
			autoLayout lr
		}

		custom "RV_INPUT_REPLACED" {
			title "Runtime - Input replaced during validation"
			include RESP_PRESENTATION RESP_CHECK_ORCHESTRATION
			exclude "relationship.tag!=Runtime_RV_INPUT_REPLACED"
			properties {
				"runtime.steps" "1=RT_017;2=RT_018"
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
