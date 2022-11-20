const functions = require("firebase-functions");
const admin = require('firebase-admin');
const uuid = require('uuid').v4
const defaultValues = require('./defaultValues')
const { getStorage } = require('firebase-admin/storage');
const Blob = require('node-blob')

admin.initializeApp({
    storageBucket: 'gs://sample-proj-for-upwork-atharv.appspot.com'
});

const fileTypes = {
    "/9j": {
        type: 'image/jpg',
        ext: "jpg"
    },
    "iVB": {
        type: "image/png",
        ext: "png"
    },
    "Qk0": {
        type: '',
        ext: "bmp"
    },
    "SUk": {
        type: '',
        ext: "tiff"
    },
    "JVB": {
        type: "application/pdf",
        ext: "pdf"
    },
    "UEs": {
        type: '',
        ext: "ofd"
    }
}

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//

// const b64toBlob = (b64Data, contentType = 'application/octet-stream', sliceSize = 512) => {
//     const byteCharacters = atob(b64Data);
//     const byteArrays = [];

//     for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
//         const slice = byteCharacters.slice(offset, offset + sliceSize);

//         const byteNumbers = new Array(slice.length);
//         for (let i = 0; i < slice.length; i++) {
//             byteNumbers[i] = slice.charCodeAt(i);
//         }

//         const byteArray = new Uint8Array(byteNumbers);
//         byteArrays.push(byteArray);
//     }

//     const blob = new Blob(byteArrays, { type: contentType });
//     return blob;
// }

const createDownloadUrl = (baseUrl, bucket_baseurl, bucket_id, pathToFile, downloadToken) => {
    return `https://firebasestorage.googleapis.com/v0${bucket_baseurl}/${bucket_id}/o/${encodeURIComponent(pathToFile)}?alt=media&token=${downloadToken}`;
};

exports.convertAndStoreData = functions.https.onRequest(async (request, response) => {

    try {

        const body = request.body;

        const base64Obj = {
            icon_url: body.icon,
            flavour_asset_pdfs_program_info: body.flavorConfig && body.flavorConfig.flavorFiles && body.flavorConfig.flavorFiles.programInfoFile ? body.flavorConfig.flavorFiles.programInfoFile : null,
            flavour_asset_images_trainer_profile: body.flavorConfig && body.flavorConfig.flavorFiles && body.flavorConfig.flavorFiles.trainerProfileFile ? body.flavorConfig.flavorFiles.trainerProfileFile : null,
            flavour_asset_images_logo: body.flavorConfig && body.flavorConfig.flavorFiles && body.flavorConfig.flavorFiles.logo ? body.flavorConfig.flavorFiles.logo : null,
            app_store_connect_credentials_private_key_file: body.appStoreConnectCredentials && body.appStoreConnectCredentials.privateKeyFile ? body.appStoreConnectCredentials.privateKeyFile : null,
            google_play_credentials_service_account_file: body.googlePlayCredentials && body.googlePlayCredentials.serviceAccountFile ? body.googlePlayCredentials.serviceAccountFile : null
        }

        const urlObj = {
            icon_url: '',
            flavour_asset_pdfs_program_info: '',
            flavour_asset_images_trainer_profile: '',
            flavour_asset_images_logo: '',
            app_store_connect_credentials_private_key_file: '',
            google_play_credentials_service_account_file: ''
        }

        const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

        for (const key in base64Obj) {
            if (Object.hasOwnProperty.call(base64Obj, key)) {
                const base64Str = base64Obj[key];
                if (!base64Str) continue;

                // const type = base64Str.split(';')[0].split('/')[1];
                const startingThreeChars = base64Str.substr(0, 3);
                const fileType = fileTypes[startingThreeChars] ? fileTypes[startingThreeChars] : { ext: '', type: 'application/octet-stream' }
                const fileExt = fileType.ext
                console.log({ startingThreeChars });
                console.log({ fileType });

                const bucket = admin.storage().bucket();
                const file_path = `public/${uuid()} -file${fileExt}`;


                // admin.storage().ref('public').child(`${uuid()} -file${fileExt}`)
                //     .putString(base64Str, 'base64', { contentType: fileType.type });

                const downloadToken = uuid()
                const file = bucket.file(file_path, {
                    metadata: {
                        metadata: {
                            firebaseStorageDownloadTokens: downloadToken
                        }
                    }
                });

                // const fileBlob = b64toBlob(base64Str, fileType.type)

                const buffer = Buffer.from(base64Str, 'base64')

                await file.save(buffer)

                const url = createDownloadUrl(bucket.storage.baseUrl, bucket.baseUrl, bucket.id, file_path, downloadToken)

                urlObj[key] = url

            }
        }


        const docData = {
            "firebaseProjectId": defaultValues.firebaseProjectId,
            "packageName": defaultValues.packageName,
            "iconUrl": urlObj.icon_url,
            "flavorConfig": {
                "flavorUrls": {
                    "joinProgramUrl": body.flavorConfig && body.flavorConfig.flavorUrls && body.flavorConfig.flavorUrls.joinProgramUrl ? body.flavorConfig.flavorUrls.joinProgramUrl : defaultValues.flavorConfig.flavorUrls.joinProgramUrl,
                    "adminPanelUrl": body.flavorConfig && body.flavorConfig.flavorUrls && body.flavorConfig.flavorUrls.adminPanelUrl ? body.flavorConfig.flavorUrls.adminPanelUrl : defaultValues.flavorConfig.flavorUrls.adminPanelUrl,
                },
                "flavorStrings": {
                    "notMemberProgramBannerTitle": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.notMemberProgramBannerTitle ? body.flavorConfig.flavorStrings.notMemberProgramBannerTitle : defaultValues.flavorConfig.flavorStrings.notMemberProgramBannerTitle,
                    "memberProgramBannerContent": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.memberProgramBannerContent ? body.flavorConfig.flavorStrings.memberProgramBannerContent : defaultValues.flavorConfig.flavorStrings.memberProgramBannerContent,
                    "notMemberProgramBannerContent": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.notMemberProgramBannerContent ? body.flavorConfig.flavorStrings.notMemberProgramBannerContent : defaultValues.flavorConfig.flavorStrings.notMemberProgramBannerContent,
                    "memberProgramBannerTitle": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.memberProgramBannerTitle ? body.flavorConfig.flavorStrings.memberProgramBannerTitle : defaultValues.flavorConfig.flavorStrings.memberProgramBannerTitle,
                    "trainerBio": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.trainerBio ? body.flavorConfig.flavorStrings.trainerBio : defaultValues.flavorConfig.flavorStrings.trainerBio,
                    "trainerBioTitle": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.trainerBioTitle ? body.flavorConfig.flavorStrings.trainerBioTitle : defaultValues.flavorConfig.flavorStrings.trainerBioTitle,
                    "trainerName": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.trainerName ? body.flavorConfig.flavorStrings.trainerName : defaultValues.flavorConfig.flavorStrings.trainerName,
                    "newsTitle": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.newsTitle ? body.flavorConfig.flavorStrings.newsTitle : defaultValues.flavorConfig.flavorStrings.newsTitle,
                    "traineesResultsGalleryTitle": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.traineesResultsGalleryTitle ? body.flavorConfig.flavorStrings.traineesResultsGalleryTitle : defaultValues.flavorConfig.flavorStrings.traineesResultsGalleryTitle,
                    "lockedContentTitle": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.lockedContentTitle ? body.flavorConfig.flavorStrings.lockedContentTitle : defaultValues.flavorConfig.flavorStrings.lockedContentTitle,
                    "flavorName": body.flavorConfig && body.flavorConfig.flavorStrings && body.flavorConfig.flavorStrings.flavorName ? body.flavorConfig.flavorStrings.flavorName : defaultValues.flavorConfig.flavorStrings.flavorName,
                    "morningGreeting": defaultValues.flavorConfig.flavorStrings.morningGreeting,
                    "nightGreeting": defaultValues.flavorConfig.flavorStrings.nightGreeting,
                    "noonGreeting": defaultValues.flavorConfig.flavorStrings.noonGreeting,
                    "eveningGreeting": defaultValues.flavorConfig.flavorStrings.eveningGreeting,
                    "workoutProgramTitle": defaultValues.flavorConfig.flavorStrings.workoutProgramTitle,
                    "notMemberProgramBannerCTA": defaultValues.flavorConfig.flavorStrings.notMemberProgramBannerCTA,
                    "notMemberProgramBannerInfoBtn": defaultValues.flavorConfig.flavorStrings.notMemberProgramBannerInfoBtn,
                    "reportReminderInstructions": defaultValues.flavorConfig.flavorStrings.reportReminderInstructions,
                    "memberProgramBannerCTA": defaultValues.flavorConfig.flavorStrings.memberProgramBannerCTA,
                    "programInfoPdfTitle": defaultValues.flavorConfig.flavorStrings.programInfoPdfTitle,
                    "nutritionProgramTitle": defaultValues.flavorConfig.flavorStrings.nutritionProgramTitle
                },
                "flavorCloudFunctionConfig": {
                    "defaultMessageNotificationTitle": body.flavorConfig && body.flavorConfig.flavorCloudFunctionConfig && body.flavorConfig.flavorCloudFunctionConfig.defaultMessageNotificationTitle ? body.flavorConfig.flavorCloudFunctionConfig.defaultMessageNotificationTitle : defaultValues.flavorConfig.flavorCloudFunctionConfig.defaultMessageNotificationTitle,
                    "defaultBroadcastMessageNotificationTitle": body.flavorConfig && body.flavorConfig.flavorCloudFunctionConfig && body.flavorConfig.flavorCloudFunctionConfig.defaultBroadcastMessageNotificationTitle ? body.flavorConfig.flavorCloudFunctionConfig.defaultBroadcastMessageNotificationTitle : defaultValues.flavorConfig.flavorCloudFunctionConfig.defaultBroadcastMessageNotificationTitle,
                    "reportReminderMessageText": body.flavorConfig && body.flavorConfig.flavorCloudFunctionConfig && body.flavorConfig.flavorCloudFunctionConfig.reportReminderMessageText ? body.flavorConfig.flavorCloudFunctionConfig.reportReminderMessageText : defaultValues.flavorConfig.flavorCloudFunctionConfig.reportReminderMessageText,
                    "reportRemindersDailyCronbtab": body.flavorConfig && body.flavorConfig.flavorCloudFunctionConfig && body.flavorConfig.flavorCloudFunctionConfig.reportRemindersDailyCronbtab ? body.flavorConfig.flavorCloudFunctionConfig.reportRemindersDailyCronbtab : defaultValues.flavorConfig.flavorCloudFunctionConfig.reportRemindersDailyCronbtab,
                    "newTraineeGreetingMessage": body.flavorConfig && body.flavorConfig.flavorCloudFunctionConfig && body.flavorConfig.flavorCloudFunctionConfig.newTraineeGreetingMessage ? body.flavorConfig.flavorCloudFunctionConfig.newTraineeGreetingMessage : defaultValues.flavorConfig.flavorCloudFunctionConfig.newTraineeGreetingMessage,
                },
                "flavorFeatureToggles": {
                    "dynamicProgressReportsFields": body.flavorConfig && body.flavorConfig.flavorFeatureToggles && body.flavorConfig.flavorFeatureToggles.dynamicProgressReportsFields && body.flavorConfig.flavorFeatureToggles.dynamicProgressReportsFields.length ?
                        body.flavorConfig.flavorFeatureToggles.dynamicProgressReportsFields.map((item) => ({
                            "title": item.title,
                            "type": item.type
                        }))
                        :
                        defaultValues.flavorConfig.flavorFeatureToggles.dynamicProgressReportsFields,
                    "availableReportReminderDays": body.flavorConfig && body.flavorConfig.flavorFeatureToggles && body.flavorConfig.flavorFeatureToggles.availableReportReminderDays ? body.flavorConfig.flavorFeatureToggles.availableReportReminderDays
                        :
                        defaultValues.flavorConfig.flavorFeatureToggles.availableReportReminderDays,
                    "lockedContentsEnabled": defaultValues.flavorConfig.flavorFeatureToggles.lockedContentsEnabled
                },
                "flavorColors": {
                    "contrastNeutral": body.flavorConfig && body.flavorConfig.flavorColors && body.flavorConfig.flavorColors.contrastNeutral ? body.flavorConfig.flavorColors.contrastNeutral : defaultValues.flavorConfig.flavorColors.contrastNeutral,
                    "secondary": body.flavorConfig && body.flavorConfig.flavorColors && body.flavorConfig.flavorColors.secondary ? body.flavorConfig.flavorColors.secondary : defaultValues.flavorConfig.flavorColors.secondary,
                    "destructive": body.flavorConfig && body.flavorConfig.flavorColors && body.flavorConfig.flavorColors.destructive ? body.flavorConfig.flavorColors.destructive : defaultValues.flavorConfig.flavorColors.destructive,
                    "contrastNeutral50": body.flavorConfig && body.flavorConfig.flavorColors && body.flavorConfig.flavorColors.contrastNeutral50 ? body.flavorConfig.flavorColors.contrastNeutral50 : defaultValues.flavorConfig.flavorColors.contrastNeutral50,
                    "neutral": body.flavorConfig && body.flavorConfig.flavorColors && body.flavorConfig.flavorColors.neutral ? body.flavorConfig.flavorColors.neutral : defaultValues.flavorConfig.flavorColors.neutral,
                    "primary": body.flavorConfig && body.flavorConfig.flavorColors && body.flavorConfig.flavorColors.primary ? body.flavorConfig.flavorColors.primary : defaultValues.flavorConfig.flavorColors.primary,
                    "primary50": body.flavorConfig && body.flavorConfig.flavorColors && body.flavorConfig.flavorColors.primary50 ? body.flavorConfig.flavorColors.primary50 : defaultValues.flavorConfig.flavorColors.primary50,
                    "secondary200": body.flavorConfig && body.flavorConfig.flavorColors && body.flavorConfig.flavorColors.secondary200 ? body.flavorConfig.flavorColors.secondary200 : defaultValues.flavorConfig.flavorColors.secondary200,
                },
                "flavorAssets": {
                    "PDFs": {
                        "programInfo": urlObj.flavour_asset_pdfs_program_info
                    },
                    "icons": {
                        "users": defaultValues.flavorConfig.flavorAssets.icons.users,
                        "plan": defaultValues.flavorConfig.flavorAssets.icons.plan,
                        "reports": defaultValues.flavorConfig.flavorAssets.icons.reports,
                        "chat": defaultValues.flavorConfig.flavorAssets.icons.chat,
                        "home": defaultValues.flavorConfig.flavorAssets.icons.home,
                        "progress": defaultValues.flavorConfig.flavorAssets.icons.progress
                    },
                    "images": {
                        "trainerProfile": urlObj.flavour_asset_images_trainer_profile,
                        "logo": urlObj.flavour_asset_images_logo,
                        "programIllustration": defaultValues.flavorConfig.flavorAssets.images.programIllustration,
                        "gymIllustration": defaultValues.flavorConfig.flavorAssets.images.gymIllustration,
                        "foodIllustration": defaultValues.flavorConfig.flavorAssets.images.foodIllustration
                    }
                }
            },
            "paymentInfo": {
                "paymentId": body.paymentInfo && body.paymentInfo.paymentId ? body.paymentInfo.paymentId : defaultValues.paymentInfo.paymentId,
            },
            "appStoreConnectCredentials": {
                "privateKeyFile": urlObj.app_store_connect_credentials_private_key_file,
                "keyId": body.appStoreConnectCredentials && body.appStoreConnectCredentials.keyId ? body.appStoreConnectCredentials.keyId : defaultValues.appStoreConnectCredentials.keyId,
                "issuerId": body.appStoreConnectCredentials && body.appStoreConnectCredentials.issuerId ? body.appStoreConnectCredentials.issuerId : defaultValues.appStoreConnectCredentials.issuerId,
            },
            "googlePlayCredentials": {
                "serviceAccountFile": urlObj.google_play_credentials_service_account_file,
            }
        }

        // const doc_uid = uuid;

        admin.firestore().collection('new').doc().create(docData)

        response.json({
            status: true,
            data: docData,
            // string: JSON.stringify(docData),
            message: "Data successfully stored in databse and image stored"
        })
    } catch (error) {
        functions.logger.error("Error in convertAndStoreData ", error);
        response.status(500).json({
            status: false,
            message: 'Internal Server Error',
            error: error.message
        })
    }
});
