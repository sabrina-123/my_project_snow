pipeline {
	agent any

	options {
		timestamps()
		timeout(time: 15, unit: 'MINUTES')
		disableConcurrentBuilds()
	}

	stages {
		stage('Installer les dependances') {
			steps {
				sh 'npm ci'
			}
		}

		stage('Tests unitaires et integration') {
			steps {
				sh 'npm run test:unit'
				sh 'npm run test:integration'
			}
		}

		stage('Couverture') {
			steps {
				sh 'npm run test:coverage'
			}
			post {
				always {
					archiveArtifacts artifacts: 'coverage/lcov.info', allowEmptyArchive: true
				}
			}
		}

		stage('Analyse SonarQube') {
			steps {
				script {
					def scannerHome = tool 'SonarQube Scanner'
					withSonarQubeEnv('SonarQube') {
						sh "${scannerHome}/bin/sonar-scanner -Dsonar.nodejs.executable=/opt/node18/bin/node"
					}
				}
			}
		}
	}

	post {
		success {
			echo 'Pipeline ShopNow termine avec succes.'
		}
		failure {
			echo 'Le pipeline ShopNow a echoue. Consultez les logs de l etape en erreur.'
		}
		always {
			cleanWs()
		}
	}
}
