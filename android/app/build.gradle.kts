plugins {
    id("io.gitlab.arturbosch.detekt")
    id("com.diffplug.spotless")
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.chamadacerta.app"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.chamadacerta.app"
        minSdk = 29
        targetSdk = 35
        versionCode = 5
        versionName = "2.2.0"
        testInstrumentationRunner = "android.test.InstrumentationTestRunner"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildTypes { release { isMinifyEnabled = false } }
    lint { abortOnError = true }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.core:core:1.15.0")
    testImplementation("junit:junit:4.13.2")
}

val mobileAssets = layout.projectDirectory.dir("src/main/assets/web")

tasks.register("verifyMobileAssets") {
    doLast {
        check(mobileAssets.file("index.html").asFile.exists()) {
            "Execute npm run mobile:sync na raiz antes de compilar o Android."
        }
    }
}

tasks.named("preBuild").configure { dependsOn("verifyMobileAssets") }

spotless {
    kotlin {
        target("src/**/*.kt")
        ktfmt("0.59").kotlinlangStyle()
    }
    kotlinGradle {
        target("*.gradle.kts")
        ktfmt("0.59").kotlinlangStyle()
    }
}

detekt {
    toolVersion = "1.23.8"
    buildUponDefaultConfig = true
    config.setFrom(rootProject.file("../config/detekt.yml"))
    source.setFrom("src/main/java", "src/test/java")
}

tasks.withType<io.gitlab.arturbosch.detekt.Detekt>().configureEach {
    jvmTarget = "17"
    reports {
        html.required.set(true)
        sarif.required.set(true)
        txt.required.set(true)
    }
}
