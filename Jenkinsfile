pipeline {
	agent any

	stages {
		stage('Installation') {
			steps {
				sh 'npm ci'
			}
		}

		stage('Tests unitaires') {
			steps {
				sh 'npm run test:unit'
			}
		}

		stage('Tests integration') {
			steps {
				sh 'npm run test:integration'
			}
		}

		stage('Couverture') {
			steps {
				sh 'npm run test:coverage'
				archiveArtifacts artifacts: 'coverage/lcov.info', fingerprint: true
			}
		}

		stage('Scan SonarQube') {
			steps {
				script {
					def scannerHome = tool 'SonarQube Scanner'
					withSonarQubeEnv('SonarQube') {
							sh "${scannerHome}/bin/sonar-scanner -Dsonar.host.url=http://sonarqube:9000 -Dsonar.nodejs.executable=/opt/node18/bin/node"
					}
				}
			}
		}
	}

	post {
		always {
			junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
		}
	}
}
