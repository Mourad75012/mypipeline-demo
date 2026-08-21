pipeline {
agent any
stages {
stage('Clone') {
steps {
echo 'Cloning repository...'
}
}
stage('Build') {
steps {
sh './run.sh'
}
}
stage('ECC') {
steps {
sh './ecc/run-ecc.sh'
}
}
}
}
